"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame, Filter, Download, FileText, Info, ShieldAlert, Clock, MapPin, ChevronRight, X, AlertOctagon, Target, Layers, Building2, Home, CheckSquare, Square, Zap, Shield, Crosshair, BarChart3, Radio } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasJcpPDF, generateDrogasChronicHotspotPDF } from "@/lib/pdfReport";
import { JURISDICTIONS_JCP_GEOJSON, JCP_MUNICIPAL_BOUNDARY_GEOJSON, POLICE_STATIONS_JCP } from "@/lib/jurisdictionsJcpGeoJSON";
import { RENABAP_JCP_GEOJSON } from "@/lib/renabapJcpGeoJSON";
import { CHRONIC_HOTSPOTS_JCP, ChronicHotspotNode } from "@/lib/chronicHotspotsJcpData";
import "leaflet/dist/leaflet.css";

interface SectionDrogasHotspotsProps {
  incidents: any[];
}

export default function SectionDrogasHotspots({ incidents = [] }: SectionDrogasHotspotsProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);
  const nodesGroupRef = useRef<any>(null);
  const jurisLayerRef = useRef<any>(null);
  const stationsLayerRef = useRef<any>(null);
  const renabapLayerRef = useRef<any>(null);

  // Tabs: Map | Matrix 10 Nodes | Esquinas Crónicas | Pareto
  const [activeTab, setActiveTab] = useState<"map" | "nodes" | "corners" | "pareto">("map");
  
  // Heatmap mode: 'general' (density of all calls) vs 'armas' (density of firearms & bunkers)
  const [heatMode, setHeatMode] = useState<"general" | "armas">("general");

  // Filters State
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterFranja, setFilterFranja] = useState<string>("todos");
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Top hostile node dynamically derived from JCP chronic nodes
  const maxHostilityNode = useMemo(() => {
    return [...CHRONIC_HOTSPOTS_JCP].sort((a, b) => b.pctArmed - a.pctArmed)[0];
  }, []);

  // Layer Toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatIntensity, setHeatIntensity] = useState<"suave" | "medio" | "intenso">("medio");
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [showRenabap, setShowRenabap] = useState<boolean>(true);
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(false);

  // Calibrations for heatmap intensity levels
  const HEAT_CALIBRATIONS = {
    general: {
      suave: { radius: 18, blur: 14, max: 1.4, weightArmas: 0.55, weightBunker: 0.45, weightNormal: 0.25, minOpacity: 0.18, opacity: "0.82" },
      medio: { radius: 22, blur: 16, max: 1.1, weightArmas: 0.75, weightBunker: 0.60, weightNormal: 0.35, minOpacity: 0.22, opacity: "0.88" },
      intenso: { radius: 27, blur: 19, max: 0.85, weightArmas: 0.90, weightBunker: 0.75, weightNormal: 0.45, minOpacity: 0.28, opacity: "0.95" },
    },
    armas: {
      suave: { radius: 20, blur: 15, max: 1.3, weightArmas: 0.70, weightBunker: 0.45, weightNormal: 0.20, minOpacity: 0.18, opacity: "0.84" },
      medio: { radius: 25, blur: 18, max: 1.0, weightArmas: 0.85, weightBunker: 0.55, weightNormal: 0.25, minOpacity: 0.22, opacity: "0.90" },
      intenso: { radius: 30, blur: 21, max: 0.75, weightArmas: 1.0, weightBunker: 0.70, weightNormal: 0.35, minOpacity: 0.28, opacity: "0.96" },
    },
  };

  // Selected Node for Tactical Dossier Modal
  const [selectedNode, setSelectedNode] = useState<ChronicHotspotNode | null>(null);

  // Selected Corner for micro dossier modal
  const [selectedCorner, setSelectedCorner] = useState<any | null>(null);

  // Filtered dataset
  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const p = (inc.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;

      if (filterSustancia !== "todos") {
        const sNorm = (inc.sustancia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fNorm = filterSustancia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (fNorm.includes("coca")) {
          if (!sNorm.includes("coca")) return false;
        } else if (fNorm.includes("paco")) {
          if (!sNorm.includes("paco") && !sNorm.includes("pasta base")) return false;
        } else if (fNorm.includes("mari")) {
          if (!sNorm.includes("mari") && !sNorm.includes("faso") && !sNorm.includes("flores")) return false;
        } else if (fNorm.includes("sintet")) {
          if (!sNorm.includes("sintet") && !sNorm.includes("pastilla") && !sNorm.includes("extasis")) return false;
        } else if (!sNorm.includes(fNorm)) {
          return false;
        }
      }
      if (filterFranja !== "todos") {
        const f = (inc.franja || "").toLowerCase();
        if (!f.includes(filterFranja.toLowerCase())) return false;
      }
      return true;
    });
  }, [incidents, filterSustancia, filterFranja]);

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
      .slice(0, 25);
  }, [filtered]);

  // Key Aggregates
  const totalCalls = filtered.length;
  const armedCalls = filtered.filter(i => i.tieneArmas || i.armas === true || i.armas === "SI").length;
  const bunkersCalls = filtered.filter(i => {
    const l = String(i.tipoLugar || "");
    return l.includes("Búnker") || l.includes("Ventanita");
  }).length;

  const top10TotalCalls = useMemo(() => {
    return CHRONIC_HOTSPOTS_JCP.reduce((acc, n) => acc + n.totalIncidents, 0);
  }, []);

  const top10ArmedCalls = useMemo(() => {
    return CHRONIC_HOTSPOTS_JCP.reduce((acc, n) => acc + n.armedIncidents, 0);
  }, []);

  const top10Bunkers = useMemo(() => {
    return CHRONIC_HOTSPOTS_JCP.reduce((acc, n) => acc + n.bunkersCount, 0);
  }, []);

  // Initialize Map ONCE
  useEffect(() => {
    let isMounted = true;

    if (activeTab === "map") {
      import("leaflet").then(async (LModule) => {
        if (!isMounted || !mapContainerRef.current) return;
        const L = (LModule as any).default || LModule;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [-34.520, -58.775],
            zoom: 13,
          });

          // Clean OpenStreetMap Tile Layer (No watermark)
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(map);

          // Municipal Boundary Frame (INDEC / IGN)
          L.geoJSON(JCP_MUNICIPAL_BOUNDARY_GEOJSON as any, {
            style: {
              color: "#334155",
              weight: 2,
              dashArray: "5, 5",
              fillColor: "#0f172a",
              fillOpacity: 0.02,
            },
            interactive: false,
          }).addTo(map);

          // A. Jurisdictions Layer
          const jurisLayer = L.geoJSON(JURISDICTIONS_JCP_GEOJSON as any, {
            style: (feature: any) => ({
              color: feature.properties.color || "#2563eb",
              weight: 1.5,
              dashArray: "4, 4",
              opacity: 0.6,
              fillColor: feature.properties.color || "#2563eb",
              fillOpacity: 0.04,
            }),
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup(`
                <div style="font-family: var(--font-sans), sans-serif; font-size: 0.85rem; color: #f8fafc; padding: 0.25rem; max-width: 270px;">
                  <strong style="color: ${feature.properties.color || '#60a5fa'}; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
                    👮 ${feature.properties.name}
                  </strong>
                  <span style="font-size: 0.8rem; color: #cbd5e1;">📍 <b style="color: #f8fafc;">Sede:</b> ${feature.properties.sede}</span><br/>
                  <span style="font-size: 0.78rem; color: #94a3b8;">${feature.properties.description}</span>
                </div>
              `);
            },
          });
          jurisLayerRef.current = jurisLayer;
          if (showJurisdictions) jurisLayer.addTo(map);

          // Police Stations Permanent Badges
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
              <div style="font-family: var(--font-sans), sans-serif; font-size: 0.85rem; color: #f8fafc; padding: 0.25rem; max-width: 270px;">
                <strong style="color: #60a5fa; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">🏛️ ${st.name}</strong>
                <div style="margin-top: 4px; color: #cbd5e1;">📍 <b style="color: #f8fafc;">Dirección:</b> ${st.sede}</div>
                <div style="color: #cbd5e1;">📞 <b style="color: #f8fafc;">Teléfono:</b> ${st.phone}</div>
                <div style="margin-top: 4px; font-size: 0.75rem; color: #94a3b8;">${st.description}</div>
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
              fillOpacity: 0.16,
            }),
            onEachFeature: (feature: any, layer: any) => {
              layer.bindPopup(`
                <div style="font-family: var(--font-sans), sans-serif; font-size: 0.85rem; color: #f8fafc; padding: 0.25rem; max-width: 270px;">
                  <strong style="color: ${feature.properties.color || '#fb923c'}; font-size: 0.95rem; display: block; margin-bottom: 0.25rem;">
                    🏚️ ${feature.properties.name}
                  </strong>
                  <span style="font-size: 0.8rem; color: #cbd5e1;"><b style="color: #f8fafc;">ID RENABAP:</b> #${feature.properties.idRenabap} · <b style="color: #f8fafc;">Familias:</b> ${feature.properties.familias}</span><br/>
                  <span style="font-size: 0.78rem; color: #94a3b8;">${feature.properties.description}</span>
                </div>
              `);
            },
          });
          renabapLayerRef.current = renabapLayer;
          if (showRenabap) renabapLayer.addTo(map);



          // D. Group for 10 Chronic Nodes
          nodesGroupRef.current = L.layerGroup().addTo(map);

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
        heatLayerRef.current = null;
        nodesGroupRef.current = null;
        jurisLayerRef.current = null;
        stationsLayerRef.current = null;
        renabapLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, [activeTab]);

  // Sync Layer Toggles
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (jurisLayerRef.current) {
      if (showJurisdictions) {
        if (!map.hasLayer(jurisLayerRef.current)) map.addLayer(jurisLayerRef.current);
        if (stationsLayerRef.current && !map.hasLayer(stationsLayerRef.current)) map.addLayer(stationsLayerRef.current);
      } else {
        if (map.hasLayer(jurisLayerRef.current)) map.removeLayer(jurisLayerRef.current);
        if (stationsLayerRef.current && map.hasLayer(stationsLayerRef.current)) map.removeLayer(stationsLayerRef.current);
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
    if (activeTab !== "map" || !mapReady || !mapInstanceRef.current) return;

    import("leaflet").then(async (LModule) => {
      const L = (LModule as any).default || LModule;
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing heatLayer
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

        const validPoints = filtered.filter((r) => r.lat && r.lng);
        const cal = HEAT_CALIBRATIONS[heatMode][heatIntensity];
        const heatPoints = validPoints.map((inc) => {
          const hasArmas = inc.tieneArmas || inc.armas === true || inc.armas === "SI";
          const isBunker = String(inc.tipoLugar || "").includes("Búnker");
          
          let weight = cal.weightNormal;
          if (hasArmas) weight = cal.weightArmas;
          else if (isBunker) weight = cal.weightBunker;

          return [inc.lat, inc.lng, weight];
        });

        if (typeof (L as any).heatLayer === "function" && heatPoints.length > 0) {
          const heat = (L as any).heatLayer(heatPoints, {
            radius: cal.radius,
            blur: cal.blur,
            maxZoom: 15,
            max: cal.max,
            minOpacity: cal.minOpacity,
            gradient: heatMode === "armas" 
              ? { 0.2: "#ef4444", 0.45: "#dc2626", 0.7: "#991b1b", 1.0: "#450a0a" }
              : { 0.15: "#2563eb", 0.35: "#06b6d4", 0.55: "#10b981", 0.7: "#f59e0b", 0.85: "#ea580c", 1.0: "#dc2626" }
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
  }, [filtered, heatMode, heatIntensity, showHeatmap, mapReady, activeTab]);

  // Render 10 Chronic Resistance Nodes (Tactical Radars & Buffers)
  useEffect(() => {
    if (activeTab !== "map" || !mapReady || !mapInstanceRef.current || !nodesGroupRef.current) return;

    import("leaflet").then((LModule) => {
      const L = (LModule as any).default || LModule;
      const group = nodesGroupRef.current;
      const map = mapInstanceRef.current;
      if (!group || !map) return;

      group.clearLayers();
      if (!showNodes) return;

      CHRONIC_HOTSPOTS_JCP.forEach((node) => {
        const isCritical = node.nivelRiesgo === "CRÍTICO";
        const baseColor = isCritical ? "#ef4444" : (node.nivelRiesgo === "SEVERO" ? "#f59e0b" : "#3b82f6");

        // 1. Concentric Tactical Buffer Circle (380m radius)
        const circle = L.circle([node.lat, node.lng], {
          radius: node.radiusMeters,
          color: baseColor,
          weight: isCritical ? 2.5 : 1.8,
          dashArray: isCritical ? "6, 4" : "4, 4",
          fillColor: baseColor,
          fillOpacity: isCritical ? 0.16 : 0.10,
        });

        circle.on("click", () => {
          setSelectedNode(node);
        });

        circle.addTo(group);

        // 2. High-Visibility Interactive Tactical Badge
        const icon = L.divIcon({
          className: "hotspot-node-badge",
          html: `<div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: ${isCritical ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' : 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)'};
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 16px;
            padding: 3px 10px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
            transform: translate(-50%, -50%);
            cursor: pointer;
            pointer-events: auto;
          ">
            <span style="background: rgba(0,0,0,0.35); border-radius: 8px; padding: 1px 5px; font-size: 10px;">⚡ #${node.id}</span>
            <span>${node.shortName.split(' y ')[0].slice(0, 18)}</span>
            <span style="background: #ffffff; color: #000; border-radius: 8px; padding: 1px 5px; font-size: 9px; font-weight: 900;">${node.totalIncidents}</span>
          </div>`,
          iconSize: [0, 0],
        });

        const marker = L.marker([node.lat, node.lng], { icon });
        marker.on("click", () => {
          setSelectedNode(node);
        });

        marker.bindTooltip(`
          <div style="font-family:sans-serif; font-size:0.8rem; padding:2px 4px;">
            <strong style="color:${baseColor}; font-size:0.88rem;">${node.name}</strong><br/>
            <span>🔴 ${node.totalIncidents} denuncias · ⚠️ ${node.pctArmed}% armados · 🏚️ ${node.bunkersCount} búnkers</span><br/>
            <span style="color:#64748b; font-size:0.72rem;">Click para abrir Dossier Táctico</span>
          </div>
        `, { direction: "top", offset: [0, -12] });

        marker.addTo(group);
      });
    });
  }, [showNodes, mapReady, activeTab]);

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Strategic Header Banner */}
      <div className="card" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", borderLeft: "4px solid #ef4444" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Flame color="#dc2626" size={20} />
              <span>Concentración Territorial & Nodos Crónicos de Resistencia Criminal (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.25rem 0 0" }}>
              Macro-análisis geoespacial de saturación delictual, densidad térmica continua (KDE) y núcleos consolidados de resistencia armada.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasJcpPDF({
                  totalIncidents: filtered.length,
                  totalUniverse: incidents.length,
                  georeferencedCount: filtered.filter((i) => i.lat && i.lng).length,
                  armasCount: armedCalls,
                  cocainaCount: filtered.filter((i) => (i.sustancia || "").toUpperCase().includes("COCA")).length,
                  marihuanaCount: filtered.filter((i) => (i.sustancia || "").toUpperCase().includes("MARI")).length,
                  pacoCount: filtered.filter((i) => (i.sustancia || "").toUpperCase().includes("PACO")).length,
                  incidents: filtered,
                  activeFilters: {
                    sustancia: filterSustancia,
                    franja: filterFranja,
                  },
                  reportType: "hotspots",
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} />
              <span>Informe Estratégico (PDF)</span>
            </button>
          </div>
        </div>

        {/* Intelligence KPIs Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1.25rem" }}>
          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>
              Concentración Territorial (Pareto)
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#f59e0b", marginTop: "2px" }}>
              {((top10TotalCalls / (totalCalls || 1)) * 100).toFixed(1)}% de Despachos
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              {top10TotalCalls} denuncias en los 10 Nodos Crónicos
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>
              Letalidad Armada en Nodos
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#ef4444", marginTop: "2px" }}>
              {((top10ArmedCalls / (top10TotalCalls || 1)) * 100).toFixed(1)}% con Armas
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              {top10ArmedCalls} hechos con balaceras / custodias
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>
              Búnkers Fortificados Mapeados
            </div>
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#a855f7", marginTop: "2px" }}>
              {top10Bunkers} Búnkers Críticos
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
              Construcciones reforzadas con expendio directo
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.85rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>
              Nodo de Máxima Hostilidad
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 900, color: "#dc2626", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={maxHostilityNode?.name}>
              {maxHostilityNode?.shortName || "San Lorenzo & Mendoza"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 700, marginTop: "2px" }}>
              🚨 {maxHostilityNode?.pctArmed}% Armado ({maxHostilityNode?.armedIncidents} de {maxHostilityNode?.totalIncidents} hechos)
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid #374151", paddingBottom: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("map")}
          style={{
            background: activeTab === "map" ? "#ef4444" : "transparent",
            color: activeTab === "map" ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Radio size={16} />
          <span>🗺️ Densidad Térmica & Nodos de Gravedad</span>
        </button>

        <button
          onClick={() => setActiveTab("nodes")}
          style={{
            background: activeTab === "nodes" ? "#ef4444" : "transparent",
            color: activeTab === "nodes" ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Shield size={16} />
          <span>🛡️ Matriz de los 10 Nodos Crónicos</span>
        </button>

        <button
          onClick={() => setActiveTab("corners")}
          style={{
            background: activeTab === "corners" ? "#ef4444" : "transparent",
            color: activeTab === "corners" ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Crosshair size={16} />
          <span>📍 Esquinas Crónicas (Micro-Epicentros)</span>
        </button>

        <button
          onClick={() => setActiveTab("pareto")}
          style={{
            background: activeTab === "pareto" ? "#ef4444" : "transparent",
            color: activeTab === "pareto" ? "#fff" : "#9ca3af",
            border: "none",
            borderRadius: "6px",
            padding: "0.5rem 1rem",
            fontSize: "0.82rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <BarChart3 size={16} />
          <span>📊 Concentración Espacial & Pareto</span>
        </button>
      </div>

      {/* TAB 1: DENSIDAD TÉRMICA & NODOS DE GRAVEDAD */}
      {activeTab === "map" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Map Controls & Filters Bar */}
          <div className="card" style={{ padding: "0.75rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
              {/* Heatmap Mode Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
                  Modo Térmico:
                </span>
                <button
                  onClick={() => setHeatMode("general")}
                  style={{
                    background: heatMode === "general" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${heatMode === "general" ? "#ef4444" : "#4b5563"}`,
                    color: heatMode === "general" ? "#fca5a5" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  🔥 Densidad General ({totalCalls})
                </button>
                <button
                  onClick={() => setHeatMode("armas")}
                  style={{
                    background: heatMode === "armas" ? "rgba(185, 28, 28, 0.3)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${heatMode === "armas" ? "#dc2626" : "#4b5563"}`,
                    color: heatMode === "armas" ? "#f87171" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ⚔️ Intensidad de Fuego & Búnkers
                </button>
              </div>

              {/* Layer Toggles */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: showHeatmap ? "rgba(239, 68, 68, 0.15)" : "transparent",
                    border: `1px solid ${showHeatmap ? "#ef4444" : "#4b5563"}`,
                    color: showHeatmap ? "#fca5a5" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showHeatmap ? <CheckSquare size={13} color="#ef4444" /> : <Square size={13} />}
                  <span>Mancha Térmica (KDE)</span>
                </button>

                {showHeatmap && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px",
                    background: "var(--bg-subtle)",
                    padding: "2px 4px",
                    borderRadius: "var(--radius-xs)",
                    border: "1px solid var(--border)",
                  }}>
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
                  onClick={() => setShowNodes(!showNodes)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: showNodes ? "rgba(245, 158, 11, 0.15)" : "transparent",
                    border: `1px solid ${showNodes ? "#f59e0b" : "#4b5563"}`,
                    color: showNodes ? "#fde68a" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showNodes ? <CheckSquare size={13} color="#f59e0b" /> : <Square size={13} />}
                  <span>Balizas 10 Nodos</span>
                </button>

                <button
                  onClick={() => setShowRenabap(!showRenabap)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: showRenabap ? "rgba(234, 88, 12, 0.15)" : "transparent",
                    border: `1px solid ${showRenabap ? "#ea580c" : "#4b5563"}`,
                    color: showRenabap ? "#fdba74" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showRenabap ? <CheckSquare size={13} color="#ea580c" /> : <Square size={13} />}
                  <span>RENABAP Oficial (53)</span>
                </button>

                <button
                  onClick={() => setShowJurisdictions(!showJurisdictions)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    background: showJurisdictions ? "rgba(37, 99, 235, 0.15)" : "transparent",
                    border: `1px solid ${showJurisdictions ? "#2563eb" : "#4b5563"}`,
                    color: showJurisdictions ? "#93c5fd" : "#9ca3af",
                    borderRadius: "4px",
                    padding: "3px 8px",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {showJurisdictions ? <CheckSquare size={13} color="#2563eb" /> : <Square size={13} />}
                  <span>Comisarías PBA</span>
                </button>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div style={{ position: "relative", width: "100%", height: "620px", borderRadius: "10px", overflow: "hidden", border: "1px solid #374151" }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

            {/* Quick Strategic Overlay */}
            <div style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              zIndex: 1000,
              maxWidth: "280px",
              color: "#fff",
              fontSize: "0.75rem"
            }}>
              <strong style={{ color: "#ef4444", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}>
                <Zap size={14} color="#ef4444" /> Nodos de Resistencia
              </strong>
              <div style={{ color: "#cbd5e1", marginTop: "4px", lineHeight: "1.3" }}>
                Haga clic en cualquiera de las <strong>10 balizas numeradas</strong> o en sus círculos de calor para abrir el <strong>Dossier Táctico</strong> de intervención.
              </div>
              <div style={{ marginTop: "6px", display: "flex", gap: "8px", fontSize: "0.7rem" }}>
                <span style={{ color: "#ef4444" }}>🔴 Crítico (&gt;75% Armas)</span>
                <span style={{ color: "#f59e0b" }}>🟡 Severo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE LOS 10 NODOS CRÓNICOS */}
      {activeTab === "nodes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1rem" }}>
            {CHRONIC_HOTSPOTS_JCP.map((node) => {
              const isCrit = node.nivelRiesgo === "CRÍTICO";
              return (
                <div
                  key={node.id}
                  className="card"
                  style={{
                    borderLeft: `4px solid ${isCrit ? '#ef4444' : '#f59e0b'}`,
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                  }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{
                        background: isCrit ? '#fee2e2' : '#fef3c7',
                        color: isCrit ? '#b91c1c' : '#b45309',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>
                        {node.nivelRiesgo} · NODO #{node.id}
                      </span>
                      <h4 style={{ margin: "0.35rem 0 0 0", fontSize: "0.95rem", color: "#f8fafc" }}>
                        {node.shortName}
                      </h4>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#f8fafc" }}>
                      {node.totalIncidents} <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>hechos</span>
                    </span>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.6rem" }}>
                    🏛️ {node.comisaria} · 🏘️ {node.barrio}
                  </div>

                  {/* Weapon Proportion Bar */}
                  <div style={{ marginBottom: "0.6rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", marginBottom: "2px" }}>
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>Hostilidad Armada: {node.pctArmed}%</span>
                      <span style={{ color: "#a855f7", fontWeight: 700 }}>{node.bunkersCount} Búnkers</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${node.pctArmed}%`, height: "100%", background: isCrit ? "#ef4444" : "#f59e0b" }} />
                    </div>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "#cbd5e1", lineHeight: 1.3, marginBottom: "0.8rem", background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: "4px" }}>
                    {node.modusOperandi}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #374151", paddingTop: "0.5rem" }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Franja: {node.franjaCritica}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      style={{
                        background: "transparent",
                        border: "1px solid #ef4444",
                        color: "#fca5a5",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Ver Dossier Táctico →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ESQUINAS CRÓNICAS (MICRO-EPICENTROS) */}
      {activeTab === "corners" && (
        <div className="card">
          <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.8rem" }}>
            <Crosshair size={18} color="#ef4444" />
            <span>Ranking de Intersecciones con Mayor Reincidencia (Top 25)</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #374151", color: "#9ca3af" }}>
                  <th style={{ padding: "8px" }}>Ranking</th>
                  <th style={{ padding: "8px" }}>Intersección / Esquina</th>
                  <th style={{ padding: "8px" }}>Barrio</th>
                  <th style={{ padding: "8px" }}>Despachos</th>
                  <th style={{ padding: "8px" }}>Armas / Fuego</th>
                  <th style={{ padding: "8px" }}>% Hostilidad</th>
                  <th style={{ padding: "8px" }}>Sustancia Dominante</th>
                  <th style={{ padding: "8px" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {chronicCorners.map((corner, idx) => {
                  const pct = corner.count > 0 ? ((corner.armedCount / corner.count) * 100).toFixed(1) : "0.0";
                  const topSust = Object.entries(corner.substances).sort((a, b) => b[1] - a[1])[0]?.[0] || "Polirubro";
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #1f2937", background: idx < 5 ? "rgba(239, 68, 68, 0.05)" : "transparent" }}>
                      <td style={{ padding: "8px", fontWeight: 800, color: idx < 3 ? "#ef4444" : "#9ca3af" }}>#{idx + 1}</td>
                      <td style={{ padding: "8px", fontWeight: 700, color: "#f8fafc" }}>{corner.name}</td>
                      <td style={{ padding: "8px", color: "#cbd5e1" }}>{corner.barrio}</td>
                      <td style={{ padding: "8px", fontWeight: 800 }}>{corner.count}</td>
                      <td style={{ padding: "8px", color: corner.armedCount > 0 ? "#ef4444" : "#64748b", fontWeight: 700 }}>
                        {corner.armedCount}
                      </td>
                      <td style={{ padding: "8px" }}>
                        <span style={{
                          background: Number(pct) >= 70 ? "#fee2e2" : "#fef3c7",
                          color: Number(pct) >= 70 ? "#b91c1c" : "#b45309",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 800
                        }}>
                          {pct}%
                        </span>
                      </td>
                      <td style={{ padding: "8px", color: "#a855f7", fontSize: "0.75rem" }}>{topSust}</td>
                      <td style={{ padding: "8px" }}>
                        <button
                          onClick={() => generateDrogasChronicHotspotPDF({ ...corner, partido: "José C. Paz" })}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid #ef4444",
                            color: "#fca5a5",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            fontWeight: 700,
                          }}
                        >
                          PDF Esquina
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONCENTRACIÓN ESPACIAL & PARETO */}
      {activeTab === "pareto" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem" }}>
          <div className="card">
            <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.6rem" }}>
              <BarChart3 size={18} color="#f59e0b" />
              <span>Ley de Pareto Territorial: Concentración de Hechos</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#9ca3af", lineHeight: 1.4 }}>
              En José C. Paz se comprueba la regla empírica del 80/20 del delito urbano: una porción diminuta del territorio absorbe la gran mayoría de los recursos del 911 y de violencia armada.
            </p>

            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {CHRONIC_HOTSPOTS_JCP.map((n, i) => {
                const cumPct = (CHRONIC_HOTSPOTS_JCP.slice(0, i + 1).reduce((a, b) => a + b.totalIncidents, 0) / (totalCalls || 1) * 100).toFixed(1);
                return (
                  <div key={n.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "2px" }}>
                      <span>#{n.id} {n.shortName}</span>
                      <span style={{ fontWeight: 700, color: "#f59e0b" }}>{n.totalIncidents} hechos ({cumPct}% acumulado)</span>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#1f2937", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(n.totalIncidents / (CHRONIC_HOTSPOTS_JCP[0].totalIncidents || 1)) * 100}%`, height: "100%", background: "#ef4444" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.6rem" }}>
              <ShieldAlert size={18} color="#ef4444" />
              <span>Recomendaciones Táctico-Operativas del MSEG</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.4 }}>
              <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "0.8rem", borderRadius: "6px", borderLeft: "3px solid #ef4444" }}>
                <strong style={{ color: "#ef4444" }}>1. Intervención con Fuerzas Tácticas (GAD / Halcón)</strong><br/>
                En los Nodos #1 (Castelli), #2 (Lasalle) y #4 (San Lorenzo), donde la tasa de armas supera el 75%, los allanamientos deben contar con anillo perimetral blindado para evitar fuego cruzado hacia móviles policiales.
              </div>

              <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "0.8rem", borderRadius: "6px", borderLeft: "3px solid #f59e0b" }}>
                <strong style={{ color: "#f59e0b" }}>2. Bloqueo de Vías de Fuga Férrea</strong><br/>
                En el Nodo #2 (Fournier y Lasalle), el terraplén del FFCC San Martín actúa como corredor de escape rápido peatonal. Se requiere apostamiento sobre la traza en sincronía con el asalto frontal.
              </div>

              <div style={{ background: "rgba(168, 85, 247, 0.08)", padding: "0.8rem", borderRadius: "6px", borderLeft: "3px solid #a855f7" }}>
                <strong style={{ color: "#a855f7" }}>3. Demolición y Clausura Definitiva de Búnkers</strong><br/>
                En el Nodo #6 (Las Tres Marías y Ruta 24), la recurrencia se sustenta en edificaciones reforzadas. Se precisa orden fiscal de demolición de muros de contención clandestinos.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECTED NODE TACTICAL DOSSIER MODAL */}
      {selectedNode && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            background: "#0f172a",
            border: "1px solid #374151",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "680px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "1.5rem",
            color: "#f8fafc",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #374151", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <span style={{
                  background: selectedNode.nivelRiesgo === "CRÍTICO" ? "#fee2e2" : "#fef3c7",
                  color: selectedNode.nivelRiesgo === "CRÍTICO" ? "#b91c1c" : "#b45309",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 800
                }}>
                  {selectedNode.nivelRiesgo} · NODO #{selectedNode.id}
                </span>
                <h3 style={{ margin: "0.4rem 0 0 0", fontSize: "1.2rem", color: "#f8fafc" }}>
                  {selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase" }}>Llamados 911</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#f8fafc" }}>{selectedNode.totalIncidents}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase" }}>Tasa Armada</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#ef4444" }}>{selectedNode.pctArmed}%</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.75rem", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase" }}>Búnkers</span>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "#a855f7" }}>{selectedNode.bunkersCount}</div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
              <div><strong>🏛️ Comisaría:</strong> {selectedNode.comisaria}</div>
              <div><strong>🏘️ Entorno Barrial:</strong> {selectedNode.barrio} (RENABAP: {selectedNode.renabapCercano})</div>
              <div><strong>🕒 Franja Crítica:</strong> {selectedNode.franjaCritica}</div>
              <div><strong>📍 Esquinas Constitutivas:</strong> {selectedNode.callesClave.join(" · ")}</div>
              <div><strong>💊 Sustancias:</strong> {selectedNode.sustanciasDominantes.join(", ")}</div>

              <div style={{ background: "rgba(239, 68, 68, 0.08)", borderLeft: "3px solid #ef4444", padding: "8px 10px", borderRadius: "4px", marginTop: "4px" }}>
                <strong style={{ color: "#ef4444" }}>Modus Operandi:</strong> {selectedNode.modusOperandi}
              </div>

              <div style={{ background: "rgba(16, 185, 129, 0.08)", borderLeft: "3px solid #10b981", padding: "8px 10px", borderRadius: "4px", marginTop: "4px" }}>
                <strong style={{ color: "#10b981" }}>Intervención Táctica Recomendada:</strong> {selectedNode.intervencionSugerida}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #374151", paddingTop: "1rem" }}>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: "#374151", border: "none", color: "#fff", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
              >
                Cerrar
              </button>

              <button
                onClick={() => {
                  generateDrogasChronicHotspotPDF({
                    name: selectedNode.name,
                    count: selectedNode.totalIncidents,
                    armedCount: selectedNode.armedIncidents,
                    lat: selectedNode.lat,
                    lng: selectedNode.lng,
                    barrio: selectedNode.barrio,
                    partido: "José C. Paz",
                    incidents: filtered.filter(i => {
                      if (!i.lat || !i.lng) return false;
                      const dLat = i.lat - selectedNode.lat;
                      const dLng = i.lng - selectedNode.lng;
                      return Math.sqrt(dLat * dLat + dLng * dLng) < 0.005;
                    })
                  });
                }}
                className="btn-export btn-pdf"
                style={{ padding: "7px 14px" }}
              >
                <FileText size={14} />
                <span>Expediente Táctico (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
