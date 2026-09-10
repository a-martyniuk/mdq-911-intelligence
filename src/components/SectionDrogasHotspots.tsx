"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame, Filter, Download, FileText, Info, ShieldAlert, Clock, MapPin, ChevronRight, X, AlertOctagon, Target, Layers, Building2, Home, Route, CheckSquare, Square } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasJcpPDF, generateDrogasTacticalDeploymentPDF, generateDrogasChronicHotspotPDF } from "@/lib/pdfReport";
import { JURISDICTIONS_JCP_GEOJSON, JCP_MUNICIPAL_BOUNDARY_GEOJSON, POLICE_STATIONS_JCP } from "@/lib/jurisdictionsJcpGeoJSON";
import { RENABAP_JCP_GEOJSON } from "@/lib/renabapJcpGeoJSON";
import { CORRIDORS_JCP_GEOJSON } from "@/lib/corridorsJcpGeoJSON";
import "leaflet/dist/leaflet.css";

interface SectionDrogasHotspotsProps {
  incidents: any[];
}

export default function SectionDrogasHotspots({ incidents = [] }: SectionDrogasHotspotsProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const jurisLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const renabapLayerRef = useRef<any>(null);
  const renabapLabelsRef = useRef<any>(null);
  const corridorsLayerRef = useRef<any>(null);

  const [activeTab, setActiveTab] = useState<"map" | "chronic">("map");
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterFranja, setFilterFranja] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Layer Toggles (Replicated from Mar del Plata)
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false);
  const [showRenabap, setShowRenabap] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(false);

  // Selected corner for chronic dossier modal
  const [selectedCorner, setSelectedCorner] = useState<any | null>(null);

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterOrigen !== "todos") {
        const o = (inc.origen || inc.Origen_Dataset || "").toUpperCase();
        const f = filterOrigen.toUpperCase();
        if (f === "DROGAS_ILICITAS_FORMAL") {
          if (!o.includes("DROGAS_ILICITAS") && !o.includes("FORMAL")) return false;
        } else if (f === "INFORMACION_VECINAL_KEYWORDS" || f === "INTELIGENCIA_RELATO_KEYWORDS") {
          if (!o.includes("KEYWORD") && !o.includes("INFORMACION") && !o.includes("RELATO")) return false;
        } else if (!o.includes(f)) {
          return false;
        }
      }
      if (filterSustancia !== "todos") {
        const s = (inc.sustancia || "").toUpperCase();
        if (!s.includes(filterSustancia.toUpperCase())) return false;
      }
      if (filterFranja !== "todos") {
        const f = (inc.franja || "").toLowerCase();
        if (!f.includes(filterFranja.toLowerCase())) return false;
      }
      if (filterArmas !== "todos") {
        const want = filterArmas === "si";
        const has = Boolean(inc.tieneArmas || inc.armas === true || inc.armas === "SI");
        if (has !== want) return false;
      }
      return true;
    });
  }, [incidents, filterOrigen, filterSustancia, filterFranja, filterArmas]);

  // Aggregate Chronic Corners (Top Intersections)
  const chronicCorners = useMemo(() => {
    const map: Record<string, {
      name: string;
      count: number;
      armedCount: number;
      barrio: string;
      lat?: number;
      lng?: number;
      substances: Record<string, number>;
      slots: Record<string, number>;
      incidents: any[];
    }> = {};

    filtered.forEach((inc) => {
      let key = (inc.direccion || inc.calle || "").trim().toUpperCase();
      if (key.length < 3) return;

      if (!map[key]) {
        map[key] = {
          name: inc.direccion || inc.calle || key,
          count: 0,
          armedCount: 0,
          barrio: inc.barrio || "José C. Paz",
          lat: inc.lat,
          lng: inc.lng,
          substances: {},
          slots: {},
          incidents: [],
        };
      }

      map[key].count += 1;
      const armed = Boolean(inc.tieneArmas || inc.armas === true || inc.armas === "SI");
      if (armed) map[key].armedCount += 1;

      const sust = (inc.sustancia || "No especificada").toUpperCase();
      map[key].substances[sust] = (map[key].substances[sust] || 0) + 1;

      const franja = inc.franja || "Sin franja";
      map[key].slots[franja] = (map[key].slots[franja] || 0) + 1;

      map[key].incidents.push(inc);
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [filtered]);

  // 1. Initialize Map ONCE
  useEffect(() => {
    let isMounted = true;

    if (activeTab === "map") {
      import("leaflet").then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [-34.520, -58.775],
            zoom: 13,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          // Municipal Boundary Base
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

          // A. Jurisdictions Layer
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
                  <span style="font-size: 0.8rem; color: #334155;">📍 <b>Sede:</b> ${feature.properties.sede}</span><br/>
                  <span style="font-size: 0.78rem; color: #64748b;">${feature.properties.description}</span>
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

          // B. RENABAP Settlements Layer
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
                  <span style="font-size: 0.8rem; color: #334155;"><b>ID RENABAP:</b> #${feature.properties.idRenabap} · <b>Familias:</b> ${feature.properties.familias}</span><br/>
                  <span style="font-size: 0.78rem; color: #64748b;">${feature.properties.description}</span>
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

          // C. Corridors Layer
          const corridorsLayer = L.geoJSON(CORRIDORS_JCP_GEOJSON as any, {
            style: (feature: any) => ({
              color: feature.properties.color || "#d97706",
              weight: 2.5,
              dashArray: "4, 3",
              opacity: 0.7,
            }),
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup(`
                <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem; max-width: 260px;">
                  <strong style="color: ${feature.properties.color || '#d97706'}; font-size: 0.95rem;">
                    🛣️ ${feature.properties.name}
                  </strong><br/>
                  <span style="font-size: 0.8rem; color: #475569;">${feature.properties.description}</span>
                </div>
              `);
            },
          });
          corridorsLayerRef.current = corridorsLayer;
          if (showCorridors) corridorsLayer.addTo(map);

          markersGroupRef.current = L.layerGroup().addTo(map);
          mapInstanceRef.current = map;
          setMapReady(true);

          setTimeout(() => {
            map.invalidateSize();
          }, 200);
        }
      });
    }

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        jurisLayerRef.current = null;
        renabapLayerRef.current = null;
        corridorsLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, [activeTab]);

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

    if (corridorsLayerRef.current) {
      if (showCorridors) {
        if (!map.hasLayer(corridorsLayerRef.current)) map.addLayer(corridorsLayerRef.current);
      } else {
        if (map.hasLayer(corridorsLayerRef.current)) map.removeLayer(corridorsLayerRef.current);
      }
    }
  }, [showJurisdictions, showRenabap, showCorridors, mapReady]);

  // 2. Dynamically render markers
  useEffect(() => {
    if (activeTab !== "map" || !mapReady || !mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const group = markersGroupRef.current;
      const map = mapInstanceRef.current;
      if (!group || !map) return;

      group.clearLayers();

      const points = filtered.filter((r) => r.lat && r.lng);

      points.forEach((inc) => {
        const isArmed = Boolean(inc.tieneArmas || inc.armas === true || inc.armas === "SI");
        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius: isArmed ? 7 : 5,
          fillColor: isArmed ? "#ef4444" : "#f59e0b",
          color: "#ffffff",
          weight: 1.2,
          fillOpacity: 0.82,
        });

        marker.bindPopup(`
          <div style="font-size:0.8rem; line-height:1.4; max-width: 280px;">
            <strong style="color:#ef4444;">ID 911 #${inc.id} - ${inc.sustancia || "Drogas"}</strong><br/>
            📍 ${inc.direccion || "José C. Paz"} (${inc.barrio || "Centro"})<br/>
            🕒 ${inc.fecha || ""} (${inc.franja || ""})<br/>
            ${isArmed ? `<span style="color:#dc2626; font-weight:700;">⚠️ Armas / Disparos</span><br/>` : ""}
            <div style="background:#f8fafc; padding:0.4rem; border-radius:4px; margin-top:0.3rem; border:1px solid #cbd5e1; max-height:120px; overflow-y:auto; font-size:0.75rem; white-space:pre-wrap; word-break:break-word;">
              ${inc.relato || "Sin relato detallado."}
            </div>
          </div>
        `);

        marker.addTo(group);
      });
    });
  }, [filtered, mapReady, activeTab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Flame color="#ef4444" size={24} />
              <span>🔥 Hotspots de Narcomenudeo & Puntos Crónicos de Resistencia (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Identificación espacial de núcleos de venta, capas jurisdiccionales, asentamientos RENABAP y planificación de despliegue táctico.
            </p>
          </div>

          {/* Report Export Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasJcpPDF({
                  totalIncidents: filtered.length,
                  totalUniverse: incidents.length,
                  georeferencedCount: filtered.filter((r) => r.lat && r.lng).length,
                  armasCount: filtered.filter((r) => r.tieneArmas || r.armas).length,
                  cocainaCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("COCAÍNA")).length,
                  marihuanaCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("MARIHUANA")).length,
                  pacoCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
                  incidents: filtered,
                  activeFilters: {
                    origen: filterOrigen,
                    sustancia: filterSustancia,
                    franja: filterFranja,
                    armas: filterArmas,
                  },
                });
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              }}
            >
              <FileText size={14} /> 📄 Informe Hotspots (PDF)
            </button>

            <button
              onClick={() => {
                generateDrogasTacticalDeploymentPDF(filtered, filterFranja, {
                  origen: filterOrigen,
                  sustancia: filterSustancia,
                  franja: filterFranja,
                  armas: filterArmas,
                });
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 0.9rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                boxShadow: "0 2px 8px rgba(124,58,237,0.3)",
              }}
            >
              <Target size={14} /> 🚨 Planilla Despliegue Táctico (PDF)
            </button>

            <button
              onClick={() => {
                const exportData = filtered.map((inc: any) => ({
                  ID: inc.id,
                  Fecha: inc.fecha,
                  Direccion: inc.direccion,
                  Barrio: inc.barrio,
                  Sustancia: inc.sustancia,
                  Tiene_Armas: (inc.tieneArmas || inc.armas) ? "SI" : "NO",
                  Franja: inc.franja,
                  Relato: inc.relato,
                }));
                exportToCSV("hotspots_drogas_jose_c_paz", exportData);
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Download size={14} /> 📊 Exportar Muestra
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          <button
            onClick={() => setActiveTab("map")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "map" ? "var(--accent-indigo)" : "transparent",
              color: activeTab === "map" ? "#fff" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Flame size={16} /> Mapa de Hotspots & Densidad ({filtered.filter(i => i.lat && i.lng).length} puntos)
          </button>

          <button
            onClick={() => setActiveTab("chronic")}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              background: activeTab === "chronic" ? "#ef4444" : "transparent",
              color: activeTab === "chronic" ? "#fff" : "var(--text-secondary)",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <MapPin size={16} /> Esquinas Crónicas & Resistencia (Top {chronicCorners.length})
          </button>
        </div>

        {/* LAYER CONTROLS TOOLBAR (Replicated from Mar del Plata Architecture) */}
        {activeTab === "map" && (
          <div style={{ background: "rgba(99, 102, 241, 0.07)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={17} color="var(--accent-indigo)" />
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase" }}>
                Capas de Inteligencia Espacial:
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowJurisdictions(!showJurisdictions)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.7rem",
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
                <Building2 size={14} /> 👮 Comisarías (3)
              </button>

              <button
                onClick={() => setShowRenabap(!showRenabap)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.7rem",
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
                <Home size={14} /> 🏘️ RENABAP (6)
              </button>

              <button
                onClick={() => setShowCorridors(!showCorridors)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.3rem 0.7rem",
                  borderRadius: "6px",
                  border: showCorridors ? "1px solid #d97706" : "1px solid var(--border)",
                  background: showCorridors ? "rgba(217, 119, 6, 0.15)" : "var(--bg-base)",
                  color: showCorridors ? "#d97706" : "var(--text-muted)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {showCorridors ? <CheckSquare size={14} /> : <Square size={14} />}
                <Route size={14} /> 🛣️ Corredores (4)
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
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
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                ⏰ Franja Horaria Táctica:
              </label>
              <select value={filterFranja} onChange={(e) => setFilterFranja(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todas las Franjas</option>
                <option value="noche">Noche (18-24 hs)</option>
                <option value="madrugada">Madrugada (00-06 hs)</option>
                <option value="tarde">Tarde (12-18 hs)</option>
                <option value="mañana">Mañana (06-12 hs)</option>
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

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => {
                  setFilterOrigen("todos");
                  setFilterSustancia("todos");
                  setFilterFranja("todos");
                  setFilterArmas("todos");
                }}
                className="btn-logout"
                style={{ height: "36px", width: "100%", fontSize: "0.75rem", fontWeight: 700 }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>

          {/* Quick time slot pills */}
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>Ventana Rápida:</span>
            {[
              { id: "todos", label: "Todas" },
              { id: "noche", label: "🌙 Noche (18-24 hs)" },
              { id: "madrugada", label: "🌌 Madrugada (00-06 hs)" },
              { id: "tarde", label: "☀️ Tarde (12-18 hs)" },
              { id: "mañana", label: "🌅 Mañana (06-12 hs)" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterFranja(p.id)}
                style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "12px",
                  border: filterFranja === p.id ? "1px solid #ef4444" : "1px solid var(--border)",
                  background: filterFranja === p.id ? "rgba(239,68,68,0.2)" : "transparent",
                  color: filterFranja === p.id ? "#ef4444" : "var(--text-secondary)",
                  fontWeight: filterFranja === p.id ? 800 : 500,
                  cursor: "pointer",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: Map View */}
        {activeTab === "map" && (
          <div style={{ position: "relative" }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "650px", borderRadius: "8px", border: "1px solid var(--border)" }} />

            {/* Floating Map Legend */}
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
                <Layers size={13} /> Capas Superpuestas
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                  <span>Despacho con Armas / Disparos</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                  <span>Denuncia sin armas reportadas</span>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.3rem", marginTop: "0.2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#93c5fd" }}>
                    <span style={{ width: "12px", height: "3px", background: "#2563eb", display: "inline-block" }} />
                    <span>Límites Comisarías 1ra, 2da y 3ra</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#fdba74" }}>
                    <span style={{ width: "12px", height: "3px", borderTop: "2px dashed #ea580c", display: "inline-block" }} />
                    <span>Asentamientos RENABAP (6)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#fcd34d" }}>
                    <span style={{ width: "12px", height: "3px", background: "#d97706", display: "inline-block" }} />
                    <span>Ruta 24, Ruta 8 y Vías FFCC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chronic Corners Ranking View */}
        {activeTab === "chronic" && (
          <div>
            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "0.9rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
                <AlertOctagon size={18} color="#ef4444" />
                <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                  MATRIZ DE RESISTENCIA & REITERANCIA CRÓNICA
                </strong>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Las esquinas aquí ordenadas concentran múltiples llamados 911 a lo largo del tiempo, evidenciando búnkers consolidados, soldaditos armados y redes de distribución con arraigo territorial. Haga clic en <strong>«Abrir Expediente»</strong> para auditar los relatos completos o <strong>«Dossier PDF»</strong> para generar la prueba procesal.
              </p>
            </div>

            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Rango</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Esquina / Intersección</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Barrio</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Total Llamados</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Hechos Armados</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>% Armado</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Franja Dominante</th>
                    <th style={{ padding: "0.65rem 0.85rem" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {chronicCorners.map((corner, idx) => {
                    const armPct = corner.count > 0 ? ((corner.armedCount / corner.count) * 100).toFixed(1) : "0.0";
                    const topSlot = Object.entries(corner.slots).sort((a, b) => b[1] - a[1])[0]?.[0] || "Noche";
                    return (
                      <tr key={corner.name} style={{ borderBottom: "1px solid var(--border)", background: idx < 3 ? "rgba(239,68,68,0.04)" : "transparent" }}>
                        <td style={{ padding: "0.65rem 0.85rem", fontWeight: 800, color: idx < 3 ? "#ef4444" : "var(--text-muted)" }}>
                          #{idx + 1}
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem" }}>
                          <strong style={{ color: "var(--text-primary)" }}>{corner.name}</strong>
                          {corner.lat && corner.lng && (
                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                              Lat: {corner.lat.toFixed(4)}, Lng: {corner.lng.toFixed(4)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem", color: "#0284c7", fontWeight: 600 }}>
                          {corner.barrio}
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem", fontWeight: 800, fontSize: "0.95rem" }}>
                          {corner.count} llamados
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem", color: "#ef4444", fontWeight: 700 }}>
                          {corner.armedCount} con armas
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem" }}>
                          <span style={{ fontWeight: 700, color: Number(armPct) > 70 ? "#dc2626" : "var(--text-primary)" }}>
                            {armPct}%
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem" }}>
                          <span style={{ fontSize: "0.75rem", background: "var(--bg-base)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                            {topSlot}
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 0.85rem" }}>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              onClick={() => setSelectedCorner(corner)}
                              style={{
                                padding: "0.3rem 0.6rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: "rgba(99,102,241,0.15)",
                                color: "var(--accent-indigo)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              📂 Expediente
                            </button>

                            <button
                              onClick={() => generateDrogasChronicHotspotPDF(corner)}
                              style={{
                                padding: "0.3rem 0.6rem",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: "rgba(239,68,68,0.15)",
                                color: "#ef4444",
                                border: "1px solid rgba(239,68,68,0.3)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              📄 Dossier PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Chronic Corner Detail Modal */}
      {selectedCorner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "10px", width: "100%", maxWidth: "850px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
            {/* Modal Header */}
            <div style={{ padding: "1.2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={20} color="#ef4444" />
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800 }}>
                    {selectedCorner.name}
                  </h3>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Barrio: <strong style={{ color: "#0284c7" }}>{selectedCorner.barrio}</strong> · {selectedCorner.count} incidentes registrados
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <button
                  onClick={() => generateDrogasChronicHotspotPDF(selectedCorner)}
                  style={{
                    height: "32px",
                    padding: "0 0.85rem",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  <FileText size={14} /> Imprimir Expediente
                </button>

                <button
                  onClick={() => setSelectedCorner(null)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Modal Body: Dispatches List */}
            <div style={{ padding: "1.2rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", background: "var(--bg-base)", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Total Despachos</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{selectedCorner.count}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Despachos Armados</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ef4444" }}>{selectedCorner.armedCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>% Armas</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ef4444" }}>
                    {((selectedCorner.armedCount / selectedCorner.count) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: "0.88rem", fontWeight: 700, margin: "0.5rem 0 0 0", textTransform: "uppercase", color: "var(--text-secondary)" }}>
                Historial Cronológico de Relatos 911 (Íntegros sin truncar)
              </h4>

              {selectedCorner.incidents.map((inc: any, i: number) => {
                const isArm = Boolean(inc.tieneArmas || inc.armas === true || inc.armas === "SI");
                return (
                  <div
                    key={inc.id || i}
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border)",
                      borderLeft: isArm ? "4px solid #ef4444" : "4px solid #3b82f6",
                      borderRadius: "6px",
                      padding: "0.75rem 0.9rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.4rem" }}>
                      <div>
                        <strong style={{ fontSize: "0.82rem" }}>ID #{inc.id}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
                          🕒 {inc.fecha || ""} {inc.hora || ""} ({inc.franja || ""})
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "rgba(99,102,241,0.15)", color: "var(--accent-indigo)" }}>
                          💊 {inc.sustancia || "No especificada"}
                        </span>
                        {isArm && (
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "1px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                            🚨 ARMAS / DISPAROS
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.45 }}>
                      {inc.relato || "Sin relato detallado registrado en el despacho."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
