"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, Filter, Download, Skull, Crosshair, ShieldAlert, Layers, Home, Info, Eye, FileText, Building2, CheckSquare, Square, Flame } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasJcpPDF } from "@/lib/pdfReport";
import { JURISDICTIONS_JCP_GEOJSON, JCP_MUNICIPAL_BOUNDARY_GEOJSON, POLICE_STATIONS_JCP } from "@/lib/jurisdictionsJcpGeoJSON";
import { RENABAP_JCP_GEOJSON } from "@/lib/renabapJcpGeoJSON";
import "leaflet/dist/leaflet.css";

interface SectionDrogasMapProps {
  incidents: any[];
}

export default function SectionDrogasMap({ incidents = [] }: SectionDrogasMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const jurisLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const renabapLayerRef = useRef<any>(null);
  const renabapLabelsRef = useRef<any>(null);

  // Filters State
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterLugar, setFilterLugar] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");
  const [filterBarrio, setFilterBarrio] = useState<string>("todos");
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Layer Toggles (Replicating Mar del Plata Layer Architecture)
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false);
  const [showRenabap, setShowRenabap] = useState<boolean>(true);
  const [showPoints, setShowPoints] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [heatIntensity, setHeatIntensity] = useState<"suave" | "medio" | "intenso">("medio");
  const [onlyBunkers, setOnlyBunkers] = useState<boolean>(false);

  const HEAT_CALIBRATIONS = {
    suave: { radius: 18, blur: 14, max: 1.4, weightArmas: 0.65, weightBunker: 0.50, weightNormal: 0.25, minOpacity: 0.18, opacity: "0.82" },
    medio: { radius: 22, blur: 16, max: 1.1, weightArmas: 0.85, weightBunker: 0.65, weightNormal: 0.35, minOpacity: 0.22, opacity: "0.88" },
    intenso: { radius: 27, blur: 19, max: 0.85, weightArmas: 1.0, weightBunker: 0.80, weightNormal: 0.45, minOpacity: 0.28, opacity: "0.95" },
  };

  // Filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const p = (inc.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;

      if (filterOrigen !== "todos") {
        const orig = (inc.origen || inc.Origen_Dataset || "").toUpperCase();
        const f = filterOrigen.toUpperCase();
        if (f === "DROGAS_ILICITAS_FORMAL") {
          if (!orig.includes("DROGAS_ILICITAS") && !orig.includes("FORMAL")) return false;
        } else if (f === "INFORMACION_VECINAL_KEYWORDS" || f === "INTELIGENCIA_RELATO_KEYWORDS") {
          if (!orig.includes("KEYWORD") && !orig.includes("INFORMACION") && !orig.includes("RELATO")) return false;
        } else if (!orig.includes(f)) {
          return false;
        }
      }
      if (filterSustancia !== "todos") {
        const sNorm = (inc.sustancia || inc.SubTipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fNorm = filterSustancia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (fNorm.includes("coca")) {
          if (!sNorm.includes("coca")) return false;
        } else if (fNorm.includes("paco")) {
          if (!sNorm.includes("paco") && !sNorm.includes("pasta base")) return false;
        } else if (fNorm.includes("mari")) {
          if (!sNorm.includes("mari") && !sNorm.includes("faso") && !sNorm.includes("flores")) return false;
        } else if (fNorm.includes("sintet")) {
          if (!sNorm.includes("sintet") && !sNorm.includes("pastilla") && !sNorm.includes("extasis")) return false;
        } else if (fNorm.includes("poli")) {
          if (!sNorm.includes("poli") && !sNorm.includes("no especificada")) return false;
        } else if (!sNorm.includes(fNorm)) {
          return false;
        }
      }
      if (filterLugar !== "todos") {
        const lugNorm = (inc.tipoLugar || inc.Tipo_Punto_Venta || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const fLugNorm = filterLugar.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (fLugNorm === "bunker") {
          if (!lugNorm.includes("bunker") && !lugNorm.includes("casilla") && !lugNorm.includes("baldio")) return false;
        } else if (fLugNorm === "pasillo") {
          if (!lugNorm.includes("pasillo")) return false;
        } else if (fLugNorm === "ventanita") {
          if (!lugNorm.includes("ventanita") && !lugNorm.includes("kiosco") && !lugNorm.includes("quiosco")) return false;
        } else if (fLugNorm === "vivienda" || fLugNorm.includes("domicilio")) {
          if (!lugNorm.includes("finca") && !lugNorm.includes("vivienda") && !lugNorm.includes("casa") && !lugNorm.includes("domicilio") && !lugNorm.includes("propiedad")) return false;
        } else if (fLugNorm === "via_publica" || fLugNorm.includes("publica") || fLugNorm.includes("esquina")) {
          if (!lugNorm.includes("via publica") && !lugNorm.includes("esquina") && !lugNorm.includes("vereda")) return false;
        } else if (fLugNorm === "no_especificado") {
          if (!lugNorm.includes("no especificado") && !lugNorm.includes("indefinido")) return false;
        } else if (!lugNorm.includes(fLugNorm)) {
          return false;
        }
      }
      if (filterArmas !== "todos") {
        const wantArmas = filterArmas === "si";
        if (inc.tieneArmas !== wantArmas) return false;
      }
      if (filterBarrio !== "todos") {
        const bar = (inc.barrio || inc.Barrio_Detectado || "").toUpperCase();
        if (!bar.includes(filterBarrio.toUpperCase())) return false;
      }
      return true;
    });
  }, [incidents, filterOrigen, filterSustancia, filterLugar, filterArmas, filterBarrio]);

  // Distinct barrios for select dropdown
  const barriosList = useMemo(() => {
    const setB = new Set<string>();
    incidents.forEach((r) => {
      const b = r.barrio || r.Barrio_Detectado;
      if (b && !b.includes("Sin Georreferenciar")) setB.add(b);
    });
    return Array.from(setB).sort();
  }, [incidents]);

  // 1. Initialize Leaflet Map ONCE
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.520, -58.775],
          zoom: 13,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Municipal Boundary (Base framing)
        L.geoJSON(JCP_MUNICIPAL_BOUNDARY_GEOJSON as any, {
          style: {
            color: "#475569",
            weight: 2,
            dashArray: "5, 5",
            fillColor: "#0f172a",
            fillOpacity: 0.03,
          },
          interactive: false,
        }).addTo(map);

        // A. Police Jurisdictions Layer
        const jurisLayer = L.geoJSON(JURISDICTIONS_JCP_GEOJSON as any, {
          style: (feature: any) => ({
            color: feature.properties.color || "#2563eb",
            weight: 1.5,
            dashArray: "4, 4",
            opacity: 0.7,
            fillColor: feature.properties.color || "#2563eb",
            fillOpacity: 0.05,
          }),
          onEachFeature: (feature: any, layer: any) => {
            layer.bindPopup(`
              <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem; max-width: 260px;">
                <strong style="color: ${feature.properties.color || '#2563eb'}; font-size: 0.95rem;">
                  👮 ${feature.properties.name}
                </strong><br/>
                <span style="font-size: 0.8rem; color: #334155;">
                  📍 <b>Sede:</b> ${feature.properties.sede}
                </span><br/>
                <span style="font-size: 0.78rem; color: #64748b;">
                  ${feature.properties.description}
                </span><br/>
                <div style="margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid #e2e8f0; font-size: 0.72rem; color: #64748b;">
                  Jurisdicción Policial Oficial (Estación Departamental José C. Paz - PBA)
                </div>
              </div>
            `);
          },
        });
        jurisLayerRef.current = jurisLayer;
        if (showJurisdictions) jurisLayer.addTo(map);

        // A2. Police Stations Permanent Badges
        const stationsGroup = L.layerGroup();
        POLICE_STATIONS_JCP.forEach((st: any) => {
          const icon = L.divIcon({
            className: "police-badge-icon",
            html: `<div style="background:#1e3a8a; color:#fff; border:1.5px solid #60a5fa; border-radius:12px; padding:2px 8px; font-size:10px; font-weight:800; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.6); pointer-events:auto; transform:translate(-50%, -50%); cursor:pointer;">
              <span>👮</span> <span>${st.name}</span>
            </div>`,
            iconSize: [0, 0],
          });
          const m = L.marker([st.center[0], st.center[1]], { icon });
          m.bindPopup(`
            <div style="font-family:sans-serif; font-size:0.85rem; color:#111; padding:0.2rem; max-width:260px;">
              <strong style="color:#1d4ed8; font-size:0.95rem;">🏛️ ${st.name}</strong><br/>
              <div style="margin-top:4px;">📍 <b>Dirección:</b> ${st.sede}</div>
              <div>📞 <b>Teléfono:</b> ${st.phone}</div>
              <div style="margin-top:4px; font-size:0.75rem; color:#64748b;">${st.description}</div>
            </div>
          `);
          stationsGroup.addLayer(m);
        });
        stationsLayerRef.current = stationsGroup;
        if (showJurisdictions) stationsGroup.addTo(map);

        // B. RENABAP Informal Settlements Layer
        const renabapLayer = L.geoJSON(RENABAP_JCP_GEOJSON as any, {
          style: (feature: any) => ({
            color: feature.properties.color || "#ea580c",
            weight: 1.5,
            dashArray: "5, 4",
            fillColor: feature.properties.color || "#ea580c",
            fillOpacity: 0.18,
          }),
          onEachFeature: (feature: any, layer: any) => {
            layer.bindPopup(`
              <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem; max-width: 260px;">
                <strong style="color: ${feature.properties.color || '#ea580c'}; font-size: 0.95rem;">
                  🏚️ ${feature.properties.name}
                </strong><br/>
                <span style="font-size: 0.8rem; color: #334155;">
                  <b>ID RENABAP:</b> #${feature.properties.idRenabap} · <b>Familias:</b> ${feature.properties.familias}
                </span><br/>
                <span style="font-size: 0.78rem; color: #64748b;">
                  ${feature.properties.description}
                </span>
                <div style="margin-top: 0.35rem; padding: 3px 6px; background: #fee2e2; color: #b91c1c; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">
                  ⚠️ Asentamiento Oficial RENABAP (Decreto 573/2023)
                </div>
              </div>
            `);
          },
        });
        renabapLayerRef.current = renabapLayer;
        if (showRenabap) renabapLayer.addTo(map);

        // B2. RENABAP Key Barrio Labels
        const renabapLabelsGroup = L.layerGroup();
        (RENABAP_JCP_GEOJSON as any).features
          .filter((f: any) => parseInt(f.properties.familias || "0") >= 150)
          .forEach((f: any) => {
            const icon = L.divIcon({
              className: "renabap-badge-icon",
              html: `<div style="background:rgba(124, 45, 18, 0.92); color:#ffedd5; border:1px solid #fb923c; border-radius:10px; padding:1px 6px; font-size:9px; font-weight:700; white-space:nowrap; box-shadow:0 1px 4px rgba(0,0,0,0.5); pointer-events:none; transform:translate(-50%, -50%);">
                🏚️ ${f.properties.name.replace("B° ", "")} (${f.properties.familias})
              </div>`,
              iconSize: [0, 0]
            });
            const m = L.marker([f.properties.center[0], f.properties.center[1]], { icon });
            renabapLabelsGroup.addLayer(m);
          });
        renabapLabelsRef.current = renabapLabelsGroup;
        if (showRenabap) renabapLabelsGroup.addTo(map);



        // D. Incidents Circle Markers LayerGroup
        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setMapReady(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        heatLayerRef.current = null;
        jurisLayerRef.current = null;
        stationsLayerRef.current = null;
        renabapLayerRef.current = null;
        renabapLabelsRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Sync Layer Toggles dynamically
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (jurisLayerRef.current) {
      if (showJurisdictions) {
        if (!map.hasLayer(jurisLayerRef.current)) map.addLayer(jurisLayerRef.current);
      } else {
        if (map.hasLayer(jurisLayerRef.current)) map.removeLayer(jurisLayerRef.current);
      }
    }

    if (renabapLayerRef.current) {
      if (showRenabap) {
        if (!map.hasLayer(renabapLayerRef.current)) map.addLayer(renabapLayerRef.current);
      } else {
        if (map.hasLayer(renabapLayerRef.current)) map.removeLayer(renabapLayerRef.current);
      }
    }
  }, [showJurisdictions, showRenabap, mapReady]);

  // Render Continuous Heatmap Layer (leaflet.heat)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    import("leaflet").then(async (LModule) => {
      const L = (LModule as any).default || LModule;
      const map = mapInstanceRef.current;
      if (!map) return;

      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      if (!showHeatmap) return;

      try {
        if (typeof window !== "undefined") {
          (window as any).L = L;
          await import("leaflet.heat");
        }

        let validPoints = filteredIncidents.filter((r) => r.lat && r.lng);
        if (onlyBunkers) {
          validPoints = validPoints.filter((r) => r.tieneArmas || (r.tipoLugar && (r.tipoLugar.includes("Búnker") || r.tipoLugar.includes("Ventanita"))));
        }

        const cal = HEAT_CALIBRATIONS[heatIntensity];
        const heatPoints = validPoints.map((inc) => {
          const hasArmas = inc.tieneArmas;
          const isBunker = inc.tipoLugar?.includes("Búnker") || inc.tipoLugar?.includes("Ventanita");

          let weight = cal.weightNormal;
          if (hasArmas) weight = cal.weightArmas;
          else if (isBunker) weight = cal.weightBunker;

          return [inc.lat, inc.lng, weight];
        });

        if (typeof (L as any).heatLayer === "function" && heatPoints.length > 0) {
          const heat = (L as any).heatLayer(heatPoints, {
            radius: cal.radius,
            blur: cal.blur,
            maxZoom: 16,
            max: cal.max,
            minOpacity: cal.minOpacity,
            gradient: { 0.15: "#2563eb", 0.35: "#06b6d4", 0.55: "#10b981", 0.7: "#f59e0b", 0.85: "#ea580c", 1.0: "#dc2626" },
          });
          heat.addTo(map);
          if (heat._canvas) {
            heat._canvas.style.opacity = cal.opacity;
            heat._canvas.style.pointerEvents = "none";
          }
          heatLayerRef.current = heat;
        }
      } catch (err) {
        console.warn("Could not initialize leaflet.heat:", err);
      }
    });
  }, [filteredIncidents, onlyBunkers, showHeatmap, heatIntensity, mapReady]);

  // 2. Dynamically update markers without destroying the map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const markersGroup = markersGroupRef.current;
      const map = mapInstanceRef.current;
      if (!markersGroup || !map) return;

      markersGroup.clearLayers();

      if (!showPoints) return;

      let points = filteredIncidents.filter((r) => r.lat && r.lng);
      if (onlyBunkers) {
        points = points.filter((r) => r.tieneArmas || (r.tipoLugar && (r.tipoLugar.includes("Búnker") || r.tipoLugar.includes("Ventanita"))));
      }

      points.forEach((inc) => {
        const sust = (inc.sustancia || "").toUpperCase();
        const hasArmas = inc.tieneArmas;
        const isBunker = inc.tipoLugar?.includes("Búnker") || inc.tipoLugar?.includes("Ventanita");

        let color = "#3b82f6";
        if (sust.includes("PACO")) {
          color = "#ec4899";
        } else if (sust.includes("COCAÍNA") || sust.includes("COCAINA")) {
          color = "#ef4444";
        } else if (sust.includes("MARIHUANA")) {
          color = "#10b981";
        } else if (hasArmas) {
          color = "#f59e0b";
        }

        const radius = isBunker ? 6 : hasArmas ? 5 : 3.5;

        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius: radius,
          fillColor: color,
          color: "#ffffff",
          weight: isBunker ? 1.0 : 0.4,
          fillOpacity: isBunker ? 0.95 : 0.75,
        });

        const aliasStr = (inc.alias && inc.alias.length > 0) ? `<div style="color:#d97706; font-weight:700;">🏷️ Alias: ${inc.alias.join(", ")}</div>` : "";
        const armasBadge = inc.tieneArmas ? `<span style="background:#fee2e2; color:#b91c1c; padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.7rem;">⚠️ ARMAMENTO DENUNCIADO</span>` : "";

        marker.bindPopup(`
          <div style="font-size:0.8rem; line-height:1.4; max-width:280px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:${color}; font-size:0.85rem;">ID 911 #${inc.id}</strong>
              ${armasBadge}
            </div>
            <div>📍 <strong>Dirección:</strong> ${inc.direccion || "José C. Paz"}</div>
            <div>🏘️ <strong>Barrio:</strong> ${inc.barrio || "Centro"}</div>
            <div>🕒 <strong>Fecha:</strong> ${inc.fecha} (${inc.franja || ""})</div>
            <div>💊 <strong>Sustancia:</strong> ${inc.sustancia}</div>
            <div>🏠 <strong>Lugar:</strong> ${inc.tipoLugar}</div>
            ${aliasStr}
            <div style="background:#f8fafc; padding:6px; border-radius:4px; margin-top:6px; border:1px solid #cbd5e1; font-size:0.75rem; max-height:120px; overflow-y:auto; color:#334155; white-space:pre-wrap; word-break:break-word;">
              ${inc.relato}
            </div>
          </div>
        `);

        marker.addTo(markersGroup);
      });
    });
  }, [filteredIncidents, showPoints, onlyBunkers, mapReady]);

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Card */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <MapPin color="#ef4444" size={20} />
              <span>Mapa Táctico Multicapa de Puntos de Venta & Búnkers (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Localización espacial integrada con capas policiales y asentamientos RENABAP oficiales.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasJcpPDF({
                  totalIncidents: filteredIncidents.length,
                  totalUniverse: incidents.length,
                  georeferencedCount: filteredIncidents.filter((r) => r.lat && r.lng).length,
                  armasCount: filteredIncidents.filter((r) => r.tieneArmas).length,
                  cocainaCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCA")).length,
                  marihuanaCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARI")).length,
                  pacoCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
                  incidents: filteredIncidents,
                  activeFilters: {
                    origen: filterOrigen,
                    sustancia: filterSustancia,
                    lugar: filterLugar,
                    armas: filterArmas,
                    barrio: filterBarrio,
                  },
                  reportType: "map",
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} /> Informe Táctico (PDF)
            </button>

            <button
              onClick={() => {
                const exportData = filteredIncidents.map((inc: any) => ({
                  ID_911: inc.id,
                  Fecha: inc.fecha,
                  Hora: inc.hora,
                  Franja: inc.franja,
                  Dia: inc.dia,
                  Direccion: inc.direccion,
                  Barrio: inc.barrio,
                  Latitud: inc.lat,
                  Longitud: inc.lng,
                  Sustancia: inc.sustancia,
                  Tipo_Lugar: inc.tipoLugar,
                  Tiene_Armas: inc.tieneArmas ? "SI" : "NO",
                  Alias: (inc.alias || []).join(" | "),
                  Origen: inc.origen,
                  Relato: inc.relato,
                }));
                exportToCSV("puntos_venta_drogas_jose_c_paz", exportData);
              }}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} /> Exportar Puntos (Excel)
            </button>
          </div>
        </div>

        {/* LAYER CONTROLS TOOLBAR (Replicated from Mar del Plata Architecture) */}
        <div style={{ background: "var(--bg-base)", border: "1px solid var(--border)", borderRadius: "8px", padding: "0.8rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} color="var(--accent-pba-blue)" />
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase" }}>
              Capas Geoespaciales Activas:
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowJurisdictions(!showJurisdictions)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: showJurisdictions ? "1px solid #2563eb" : "1px solid var(--border)",
                background: showJurisdictions ? "rgba(37, 99, 235, 0.15)" : "var(--bg-base)",
                color: showJurisdictions ? "#2563eb" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showJurisdictions ? <CheckSquare size={14} /> : <Square size={14} />}
              <Building2 size={14} /> 👮 Comisarías JCP (3)
            </button>

            <button
              onClick={() => setShowRenabap(!showRenabap)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: showRenabap ? "1px solid #ea580c" : "1px solid var(--border)",
                background: showRenabap ? "rgba(234, 88, 12, 0.15)" : "var(--bg-base)",
                color: showRenabap ? "#ea580c" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showRenabap ? <CheckSquare size={14} /> : <Square size={14} />}
              <Home size={14} /> 🏘️ RENABAP Oficial (53)
            </button>

            <button
              onClick={() => setShowPoints(!showPoints)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: showPoints ? "1px solid #ef4444" : "1px solid var(--border)",
                background: showPoints ? "rgba(239, 68, 68, 0.15)" : "var(--bg-base)",
                color: showPoints ? "#ef4444" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showPoints ? <CheckSquare size={14} /> : <Square size={14} />}
              <MapPin size={14} /> 💊 Puntos Venta ({filteredIncidents.filter(r => r.lat && r.lng).length})
            </button>

            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: showHeatmap ? "1px solid #ef4444" : "1px solid var(--border)",
                background: showHeatmap ? "rgba(239, 68, 68, 0.15)" : "var(--bg-base)",
                color: showHeatmap ? "#ef4444" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {showHeatmap ? <CheckSquare size={14} /> : <Square size={14} />}
              <Flame size={14} /> 🔥 Mancha Térmica (KDE)
            </button>

            {showHeatmap && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  background: "var(--bg-subtle)",
                  padding: "2px 4px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "0 3px", fontWeight: 600 }}>
                  Intensidad:
                </span>
                {(["suave", "medio", "intenso"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setHeatIntensity(lvl)}
                    style={{
                      padding: "2px 7px",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      borderRadius: "3px",
                      border: heatIntensity === lvl ? "1px solid #fca5a5" : "1px solid transparent",
                      background: heatIntensity === lvl ? "#fee2e2" : "transparent",
                      color: heatIntensity === lvl ? "#b91c1c" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      textTransform: "capitalize",
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setOnlyBunkers(!onlyBunkers)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: onlyBunkers ? "1px solid #dc2626" : "1px solid var(--border)",
                background: onlyBunkers ? "rgba(220, 38, 38, 0.15)" : "var(--bg-base)",
                color: onlyBunkers ? "#dc2626" : "var(--text-muted)",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {onlyBunkers ? <CheckSquare size={14} /> : <Square size={14} />}
              <span>⚡ Solo Focos Críticos (Búnkers / Armados)</span>
            </button>
          </div>
        </div>

        {/* Filter Selectors Bar */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                📑 Vertiente / Fuente 911:
              </label>
              <select value={filterOrigen} onChange={(e) => setFilterOrigen(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todas las Fuentes (1.770 despachos)</option>
                <option value="DROGAS_ILICITAS_FORMAL">🔴 Despacho Formal Drogas (989 hechos)</option>
                <option value="INFORMACION_VECINAL_KEYWORDS">🟢 Búsqueda Semántica Relatos (781 hechos)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                💊 Sustancia:
              </label>
              <select value={filterSustancia} onChange={(e) => setFilterSustancia(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todas las Sustancias</option>
                <option value="COCAÍNA">Cocaína</option>
                <option value="PACO">Paco / Pasta Base</option>
                <option value="MARIHUANA">Marihuana</option>
                <option value="SINTETICAS">Sintéticas / Pastillas</option>
                <option value="POLIRUBRO">Polirubro / Sin especificar</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🏠 Tipo de Espacio / Punto:
              </label>
              <select value={filterLugar} onChange={(e) => setFilterLugar(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todos los Tipos de Lugar</option>
                <option value="bunker">Búnkers / Casillas / Baldíos</option>
                <option value="pasillo">Pasillos de Asentamiento</option>
                <option value="ventanita">Ventanitas / Kioscos</option>
                <option value="vivienda">Fincas / Domicilios / Viviendas</option>
                <option value="via_publica">Vía Pública / Esquinas</option>
                <option value="no_especificado">Lugar No Especificado</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🔫 Presencia de Armas:
              </label>
              <select value={filterArmas} onChange={(e) => setFilterArmas(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todas las denuncias</option>
                <option value="si">Solo con Armas / Disparos</option>
                <option value="no">Sin armas reportadas</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🏘️ Barrio Detectado:
              </label>
              <select value={filterBarrio} onChange={(e) => setFilterBarrio(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todos los Barrios ({barriosList.length})</option>
                {barriosList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ position: "relative" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "650px", borderRadius: "8px", border: "1px solid var(--border)" }} />

          {/* Floating Map Legend (Replicated from Mar del Plata) */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              right: "20px",
              background: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "8px",
              padding: "0.75rem 0.9rem",
              zIndex: 1000,
              fontSize: "0.75rem",
              color: "#f8fafc",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              maxWidth: "280px",
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 800, textTransform: "uppercase", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Layers size={13} /> Referencias Cartográficas
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <span>Cocaína / Foco Crítico Armado</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ec4899", display: "inline-block" }} />
                <span>Paco / Pasta Base (Deterioro)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                <span>Marihuana (Venta / Acopio)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                <span>Sustancia Combinada / Armas</span>
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.3rem", marginTop: "0.2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#93c5fd" }}>
                  <span style={{ width: "12px", height: "3px", background: "#2563eb", display: "inline-block" }} />
                  <span>Comisarías 1ra, 2da y 3ra JCP</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#fdba74" }}>
                  <span style={{ width: "12px", height: "3px", borderTop: "2px dashed #ea580c", display: "inline-block" }} />
                  <span>Asentamientos RENABAP (53)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
