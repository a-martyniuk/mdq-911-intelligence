"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Flame, Car, ShieldAlert, Info, Filter, Download, FileText, Clock, Calendar, Layers, MapPin, Eye, CheckSquare, Square } from "lucide-react";
import { getApiUrl } from "@/lib/apiUrl";
import { exportToCSV } from "@/lib/excelExport";
import { generateHotspotsPDF } from "@/lib/pdfReport";
import { POLICE_JURISDICTIONS_GEOJSON } from "@/lib/jurisdictionsGeoJSON";
import { RENABAP_BARRIOS_GEOJSON } from "@/lib/renabapGeoJSON";
import "leaflet/dist/leaflet.css";

interface SectionHotspotsProps {
  incidents?: any[];
  geoPoints?: any[];
}

// Interactive Leaflet Dynamic Hotspots Map Component
function InteractiveHotspotsMap({
  incidents = [],
  showHeatmap = true,
  heatIntensity = "medio",
  showMarkers = false,
  showJurisdictions = true,
  showRenabap = true,
}: {
  incidents: any[];
  showHeatmap: boolean;
  heatIntensity: "suave" | "medio" | "intenso";
  showMarkers: boolean;
  showJurisdictions: boolean;
  showRenabap: boolean;
}) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const heatLayerRef = React.useRef<any>(null);
  const markersGroupRef = React.useRef<any>(null);
  const jurisLayerRef = React.useRef<any>(null);
  const renabapLayerRef = React.useRef<any>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const HEAT_CALIBRATIONS = {
    suave: {
      radius: 18,
      blur: 14,
      max: 1.4,
      weightNormal: 0.22,
      weightHigh: 0.50,
      minOpacity: 0.18,
      opacity: "0.82",
    },
    medio: {
      radius: 22,
      blur: 16,
      max: 1.0,
      weightNormal: 0.32,
      weightHigh: 0.65,
      minOpacity: 0.22,
      opacity: "0.88",
    },
    intenso: {
      radius: 27,
      blur: 19,
      max: 0.75,
      weightNormal: 0.42,
      weightHigh: 0.85,
      minOpacity: 0.28,
      opacity: "0.95",
    },
  };

  // 1. Initialize Leaflet Map ONCE
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-37.995, -57.565],
          zoom: 12,
        });

        // Polygons custom pane (between tile 200 and overlay 400)
        const polyPane = map.createPane("polygonsPane");
        polyPane.style.zIndex = "350";

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Layer: Comisarías (Blue Boundaries in polygonsPane)
        const jurisLayer = L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
          pane: "polygonsPane",
          style: (feature: any) => ({
            color: feature.properties.color || "#2563eb",
            weight: 2,
            opacity: 0.85,
            fillColor: feature.properties.color || "#3b82f6",
            fillOpacity: showHeatmap ? 0.04 : 0.18,
          }),
          onEachFeature: (feature: any, layer: any) => {
            layer.bindPopup(`
              <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
                <strong style="color: ${feature.properties.color || '#2563eb'}; font-size: 0.95rem;">
                  👮 ${feature.properties.name}
                </strong><br/>
                <span style="font-size: 0.8rem; color: #444;">
                  <b>Zonas:</b> ${feature.properties.description || feature.properties.barrios}
                </span>
              </div>
            `);
          },
        });
        jurisLayerRef.current = jurisLayer;
        if (showJurisdictions) jurisLayer.addTo(map);

        // Layer: RENABAP (Orange Boundaries in polygonsPane)
        const renabapLayer = L.geoJSON(RENABAP_BARRIOS_GEOJSON, {
          pane: "polygonsPane",
          style: (feature: any) => ({
            color: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
            weight: feature.properties.isRenabap ? 2.5 : 1.2,
            dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
            fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
            fillOpacity: feature.properties.isRenabap ? (showHeatmap ? 0.08 : 0.28) : 0.05,
          }),
          onEachFeature: (feature: any, layer: any) => {
            const isR = feature.properties.isRenabap;
            layer.bindPopup(`
              <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
                <strong style="color: ${isR ? '#ea580c' : '#0284c7'}; font-size: 0.95rem;">
                  ${isR ? '🏡 RENABAP: ' : '📍 '}${feature.properties.name}
                </strong>
              </div>
            `);
          },
        });
        renabapLayerRef.current = renabapLayer;
        if (showRenabap) renabapLayer.addTo(map);

        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setMapReady(true);
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
        renabapLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // 2. Sync Polygon Layers & Dynamic Fills based on heatmap
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (jurisLayerRef.current) {
      if (showJurisdictions) {
        if (!map.hasLayer(jurisLayerRef.current)) map.addLayer(jurisLayerRef.current);
        jurisLayerRef.current.setStyle((feature: any) => ({
          color: feature.properties.color || "#2563eb",
          weight: 2,
          opacity: 0.85,
          fillColor: feature.properties.color || "#3b82f6",
          fillOpacity: showHeatmap ? 0.04 : 0.18,
        }));
      } else {
        if (map.hasLayer(jurisLayerRef.current)) map.removeLayer(jurisLayerRef.current);
      }
    }

    if (renabapLayerRef.current) {
      if (showRenabap) {
        if (!map.hasLayer(renabapLayerRef.current)) map.addLayer(renabapLayerRef.current);
        renabapLayerRef.current.setStyle((feature: any) => ({
          color: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
          weight: feature.properties.isRenabap ? 2.5 : 1.2,
          dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
          fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
          fillOpacity: feature.properties.isRenabap ? (showHeatmap ? 0.08 : 0.28) : 0.05,
        }));
      } else {
        if (map.hasLayer(renabapLayerRef.current)) map.removeLayer(renabapLayerRef.current);
      }
    }
  }, [showJurisdictions, showRenabap, showHeatmap, mapReady]);

  // 3. Render Continuous Heatmap Layer (leaflet.heat)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap) return;

    import("leaflet").then(async (leafletModule) => {
      const L = leafletModule.default || leafletModule;
      try {
        if (typeof window !== "undefined") {
          (window as any).L = L;
          await import("leaflet.heat");
        }

        const cal = HEAT_CALIBRATIONS[heatIntensity];
        const heatPoints: [number, number, number][] = [];

        incidents.forEach((inc: any) => {
          const rawLat = inc.Latitud_Clean ?? inc.Latitud ?? inc.lat ?? 0;
          const rawLon = inc.Longitud_Clean ?? inc.Longitud ?? inc.lng ?? 0;
          const lat = typeof rawLat === "number" ? rawLat : parseFloat(rawLat);
          const lon = typeof rawLon === "number" ? rawLon : parseFloat(rawLon);

          if (!isNaN(lat) && !isNaN(lon) && lat < -37.5 && lat > -38.5 && lon < -57.0 && lon > -58.2) {
            const origen = (inc.Origen_Dataset || inc.origen || inc.Tipo || inc.tipo || "").toUpperCase();
            const isArmas = origen.includes("ARMA") || origen.includes("DISPARO");
            const isHallazgo = origen.includes("HALLAZGO");
            const weight = isArmas ? cal.weightHigh : isHallazgo ? cal.weightNormal * 0.8 : cal.weightNormal;
            heatPoints.push([lat, lon, weight]);
          }
        });

        if (typeof (L as any).heatLayer === "function" && heatPoints.length > 0) {
          const heat = (L as any).heatLayer(heatPoints, {
            radius: cal.radius,
            blur: cal.blur,
            maxZoom: 15,
            max: cal.max,
            minOpacity: cal.minOpacity,
            gradient: {
              0.15: "#2563eb",
              0.35: "#06b6d4",
              0.55: "#10b981",
              0.70: "#f59e0b",
              0.85: "#ea580c",
              1.00: "#dc2626",
            },
          });
          heat.addTo(map);
          if (heat._canvas) {
            heat._canvas.style.opacity = cal.opacity;
            heat._canvas.style.pointerEvents = "none";
          }
          heatLayerRef.current = heat;
        }
      } catch (err) {
        console.warn("Could not load leaflet.heat in SectionHotspots:", err);
      }
    });
  }, [showHeatmap, heatIntensity, incidents, mapReady]);

  // 4. Render Circle Markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    markersGroup.clearLayers();

    if (!showMarkers) return;

    import("leaflet").then((L) => {
      const pointsToPlot = incidents.slice(0, 1500);

      pointsToPlot.forEach((inc: any) => {
        const lat = parseFloat(inc.Latitud_Clean || inc.lat);
        const lng = parseFloat(inc.Longitud_Clean || inc.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const origenUpper = (inc.Origen_Dataset || inc.origen || inc.Tipo || inc.tipo || "").toUpperCase();
        const isHallazgos = origenUpper.includes("HALLAZGO");
        const isDisparos = origenUpper.includes("DISPARO");
        const isArmas = origenUpper.includes("ARMA");

        const color = isHallazgos ? "#10b981" : isDisparos ? "#f59e0b" : isArmas ? "#dc2626" : "#ef4444";

        const marker = L.circleMarker([lat, lng], {
          radius: isArmas || isDisparos ? 6.5 : 5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.2,
          fillOpacity: 0.82,
        });

        marker.bindPopup(`
          <div style="font-size:0.8rem; line-height:1.4;">
            <strong style="color:${color};">ID 911 #${inc.ID || inc.id} - ${inc.Tipo || inc.tipo}</strong><br/>
            📍 ${inc.Dirección || inc.direccion || "MDQ"}<br/>
            🕒 ${inc.Fecha || inc.fecha || ""} (${inc.Franja_Horaria || inc.franja || ""})<br/>
            ${inc.Patente_Principal ? `🏷️ <strong>Patente:</strong> ${inc.Patente_Principal}<br/>` : ""}
            <div style="background:#f8fafc; padding:0.4rem; border-radius:4px; margin-top:0.3rem; border:1px solid #cbd5e1; max-height:120px; overflow-y:auto; font-size:0.75rem; white-space:pre-wrap; word-break:break-word;">
              ${inc.Relato || inc.relato || "Sin relato cargado."}
            </div>
          </div>
        `);

        marker.addTo(markersGroup);
      });
    });
  }, [incidents, showMarkers, mapReady]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "650px" }} />;
}

export default function SectionHotspots({ incidents = [], geoPoints = [] }: SectionHotspotsProps) {
  const [activeTab, setActiveTab] = useState<"general" | "robos" | "armas">("general");

  // Layer Toggles & Heat Intensity State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatIntensity, setHeatIntensity] = useState<"suave" | "medio" | "intenso">("medio");
  const [showMarkers, setShowMarkers] = useState<boolean>(false);
  const [showJurisdictions, setShowJurisdictions] = useState<boolean>(true);
  const [showRenabap, setShowRenabap] = useState<boolean>(true);

  // Interactive Filters State
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [filterFranja, setFilterFranja] = useState<string>("todos");
  const [filterDia, setFilterDia] = useState<string>("todos");
  const [mapMode, setMapMode] = useState<"interactive" | "kde_hd">("interactive");

  // Determine effective dataset to filter
  const dataset = useMemo(() => {
    return incidents.length > 0 ? incidents : geoPoints;
  }, [incidents, geoPoints]);

  // Apply filters
  const filteredIncidents = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];

    return dataset.filter((inc: any) => {
      // Filter by Tipo
      if (filterTipo !== "todos") {
        const origenUpper = (inc.Origen_Dataset || inc.origen || inc.Tipo || inc.tipo || "").toUpperCase();
        if (filterTipo === "robos" && !origenUpper.includes("ROBO")) return false;
        if (filterTipo === "hallazgos" && !origenUpper.includes("HALLAZGO")) return false;
        if (filterTipo === "armas" && (!origenUpper.includes("ARMA") && !origenUpper.includes("DISPARO"))) return false;
      }

      // Filter by Franja Horaria
      if (filterFranja !== "todos") {
        const franja = (inc.Franja_Horaria || inc.franja || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fFranja = filterFranja.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!franja.includes(fFranja)) return false;
      }

      // Filter by Día de la Semana
      if (filterDia !== "todos") {
        const dia = (inc.Dia_Semana || inc.dia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fDia = filterDia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (!dia.includes(fDia)) return false;
      }

      return true;
    });
  }, [dataset, filterTipo, filterFranja, filterDia]);

  // Handle Tipo Dropdown Change & Sync with Active Tab
  const handleTipoChange = (val: string) => {
    setFilterTipo(val);
    if (val === "robos") {
      setActiveTab("robos");
    } else if (val === "armas") {
      setActiveTab("armas");
    } else if (val === "todos") {
      setActiveTab("general");
    }
  };

  // Generate Filter Summary text for reports
  const filterSummary = useMemo(() => {
    const parts = [];
    if (filterTipo !== "todos") parts.push(`Delito: ${filterTipo.toUpperCase()}`);
    if (filterFranja !== "todos") parts.push(`Franja: ${filterFranja.toUpperCase()}`);
    if (filterDia !== "todos") parts.push(`Día: ${filterDia.toUpperCase()}`);
    return parts.length > 0 ? parts.join(" | ") : "Filtros Globales Aplicados (Total Muestra)";
  }, [filterTipo, filterFranja, filterDia]);

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Main Card Header */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Flame color="#ef4444" size={20} />
              <span>Concentración Delictiva y Mapa de Densidad Kernel (KDE)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Identificación de núcleos urbanos de alta concentración delictiva sobre mapa base con filtros dinámicos en vivo.
            </p>
          </div>

          {/* Action & Report Export Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateHotspotsPDF({
                  incidents: filteredIncidents,
                  filterSummary,
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} /> Informe PDF KDE
            </button>

            <button
              onClick={() => {
                const exportData = filteredIncidents.map((inc: any) => ({
                  ID_911: inc.ID || inc.id,
                  Tipo: inc.Tipo || inc.tipo,
                  SubTipo: inc.SubTipo || inc.subtipo,
                  Origen_Dataset: inc.Origen_Dataset || inc.origen,
                  Fecha: inc.Fecha || inc.fecha,
                  Hora: inc.Hora || inc.hora,
                  Franja_Horaria: inc.Franja_Horaria || inc.franja,
                  Dia_Semana: inc.Dia_Semana || inc.dia,
                  Direccion: inc.Dirección || inc.direccion || "",
                  Patente: inc.Patente_Principal || inc.patente || "",
                  Marca: inc.Marca_Detectada || inc.marca || "",
                }));
                exportToCSV("informe_hotspots_kde_filtrado", exportData);
              }}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} /> Exportar Muestra (Excel)
            </button>
          </div>
        </div>

        {/* Dynamic Filters Control Panel */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            <Filter size={16} color="var(--accent-indigo)" />
            <span>Filtros Multidimensionales de Concentración:</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
              Mostrando <strong>{filteredIncidents.length.toLocaleString()}</strong> de {dataset.length.toLocaleString()} incidentes totales
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {/* Filter by Tipo / Delito */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🎯 Tipo de Delito:
              </label>
              <select
                value={filterTipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todos los Delitos</option>
                <option value="robos">🔴 Robos Vehiculares</option>
                <option value="hallazgos">🟢 Hallazgos / Descartes</option>
                <option value="armas">🟡 Armas & Disparos</option>
              </select>
            </div>

            {/* Filter by Franja Horaria */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                ⏰ Franja Horaria:
              </label>
              <select
                value={filterFranja}
                onChange={(e) => setFilterFranja(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todas las Franjas (24 hs)</option>
                <option value="madrugada">🌙 Madrugada (00-06 hs)</option>
                <option value="mañana">☀️ Mañana (06-12 hs)</option>
                <option value="tarde">🌆 Tarde (12-18 hs)</option>
                <option value="noche">🌃 Noche (18-24 hs)</option>
              </select>
            </div>

            {/* Filter by Día de la Semana */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                📅 Día de la Semana:
              </label>
              <select
                value={filterDia}
                onChange={(e) => setFilterDia(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todos los Días</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miércoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sábado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            {/* Filter Reset & Mode Selector */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => {
                  setFilterTipo("todos");
                  setFilterFranja("todos");
                  setFilterDia("todos");
                  setActiveTab("general");
                }}
                className="btn-export"
                style={{ height: "36px", padding: "0 0.75rem", fontSize: "12px", fontWeight: 600, width: "100%", justifyContent: "center" }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tab Presets & Map View Mode Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "inline-flex", padding: "3px", background: "var(--bg-base)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", gap: "2px", flexWrap: "wrap" }}>
            <button
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid",
                transition: "all var(--duration-fast) var(--ease-out)",
                background: activeTab === "general" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "general" ? "var(--text-primary)" : "var(--text-muted)",
                borderColor: activeTab === "general" ? "var(--border-focus)" : "transparent",
                boxShadow: activeTab === "general" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
              onClick={() => {
                setActiveTab("general");
                setFilterTipo("todos");
              }}
            >
              <Flame size={14} color="#ef4444" /> Densidad General ({incidents && incidents.length > 0 ? incidents.length.toLocaleString() : "8.598"} Casos)
            </button>

            <button
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid",
                transition: "all var(--duration-fast) var(--ease-out)",
                background: activeTab === "robos" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "robos" ? "var(--text-primary)" : "var(--text-muted)",
                borderColor: activeTab === "robos" ? "var(--border-focus)" : "transparent",
                boxShadow: activeTab === "robos" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
              onClick={() => {
                setActiveTab("robos");
                setFilterTipo("robos");
              }}
            >
              <Car size={14} color="#38bdf8" /> Focos de Robos Vehiculares
            </button>

            <button
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                border: "1px solid",
                transition: "all var(--duration-fast) var(--ease-out)",
                background: activeTab === "armas" ? "var(--bg-elevated)" : "transparent",
                color: activeTab === "armas" ? "var(--text-primary)" : "var(--text-muted)",
                borderColor: activeTab === "armas" ? "var(--border-focus)" : "transparent",
                boxShadow: activeTab === "armas" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
              onClick={() => {
                setActiveTab("armas");
                setFilterTipo("armas");
              }}
            >
              <ShieldAlert size={14} color="#f59e0b" /> Focos Armas & Disparos
            </button>
          </div>

          <div style={{ display: "inline-flex", padding: "3px", background: "var(--bg-base)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", gap: "2px" }}>
            <button
              onClick={() => setMapMode("interactive")}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                transition: "all var(--duration-fast) var(--ease-out)",
                background: mapMode === "interactive" ? "var(--bg-elevated)" : "transparent",
                color: mapMode === "interactive" ? "#38bdf8" : "var(--text-muted)",
                borderColor: mapMode === "interactive" ? "rgba(56, 189, 248, 0.4)" : "transparent",
                boxShadow: mapMode === "interactive" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              Mapa Dinámico (Filtros en Vivo)
            </button>

            <button
              onClick={() => setMapMode("kde_hd")}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid",
                transition: "all var(--duration-fast) var(--ease-out)",
                background: mapMode === "kde_hd" ? "var(--bg-elevated)" : "transparent",
                color: mapMode === "kde_hd" ? "#a855f7" : "var(--text-muted)",
                borderColor: mapMode === "kde_hd" ? "rgba(168, 85, 247, 0.4)" : "transparent",
                boxShadow: mapMode === "kde_hd" ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              }}
            >
              Capa KDE HD Pre-Calculada
            </button>
          </div>
        </div>

        {/* Map Container View */}
        <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {mapMode === "interactive" ? (
            <>
              {/* Layer Toggles & Heat Intensity Bar for Interactive Map */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.6rem 0.85rem",
                background: "var(--bg-surface)",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "4px 9px",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${showHeatmap ? "#ef4444" : "var(--border)"}`,
                      background: showHeatmap ? "#fee2e2" : "var(--bg-base)",
                      color: showHeatmap ? "#b91c1c" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {showHeatmap ? <CheckSquare size={13} color="#ef4444" /> : <Square size={13} />}
                    <span>🔥 Mancha Térmica (KDE)</span>
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
                      <span style={{ fontSize: "10.5px", color: "var(--text-muted)", padding: "0 4px", fontWeight: 600 }}>
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
                    onClick={() => setShowMarkers(!showMarkers)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "4px 9px",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${showMarkers ? "var(--accent-pba-blue)" : "var(--border)"}`,
                      background: showMarkers ? "#eff6ff" : "var(--bg-base)",
                      color: showMarkers ? "#0d5ca8" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {showMarkers ? <CheckSquare size={13} color="var(--accent-pba-blue)" /> : <Square size={13} />}
                    <span>📍 Puntos 911 Individuales</span>
                  </button>

                  <button
                    onClick={() => setShowJurisdictions(!showJurisdictions)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "4px 9px",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${showJurisdictions ? "#3b82f6" : "var(--border)"}`,
                      background: showJurisdictions ? "#eff6ff" : "var(--bg-base)",
                      color: showJurisdictions ? "#1d4ed8" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {showJurisdictions ? <CheckSquare size={13} color="#2563eb" /> : <Square size={13} />}
                    <span>👮 Comisarías (1ra-16ta)</span>
                  </button>

                  <button
                    onClick={() => setShowRenabap(!showRenabap)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "4px 9px",
                      borderRadius: "var(--radius-xs)",
                      border: `1px solid ${showRenabap ? "#ea580c" : "var(--border)"}`,
                      background: showRenabap ? "#fff7ed" : "var(--bg-base)",
                      color: showRenabap ? "#c2410c" : "var(--text-secondary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {showRenabap ? <CheckSquare size={13} color="#ea580c" /> : <Square size={13} />}
                    <span>🏡 RENABAP</span>
                  </button>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                  {filteredIncidents.length.toLocaleString()} despachos analizados
                </div>
              </div>

              <InteractiveHotspotsMap
                incidents={filteredIncidents}
                showHeatmap={showHeatmap}
                heatIntensity={heatIntensity}
                showMarkers={showMarkers}
                showJurisdictions={showJurisdictions}
                showRenabap={showRenabap}
              />
            </>
          ) : (
            <>
              {activeTab === "general" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_densidad.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Concentración General"
                />
              )}
              {activeTab === "robos" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_robos.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Focos Robos"
                />
              )}
              {activeTab === "armas" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_armas_disparos.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Focos Armas"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Explanatory Methodology Card */}
      <div className="card">
        <div className="card-title" style={{ gap: "0.5rem" }}>
          <Info size={20} color="var(--accent-indigo)" />
          <span>Explicación Metodológica: Estimación de Densidad por Kernel (KDE)</span>
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <p style={{ marginBottom: "0.75rem" }}>
            La <strong>Estimación de Densidad por Kernel (KDE)</strong> es un método no paramétrico para estimar la función de densidad de probabilidad de una variable aleatoria espacial continua (coordenadas geográficas).
          </p>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Radio de Cobertura ($r=5$ px):</strong> Para evitar la sobre-saturación de la ciudad (mancha uniforme amarilla), se ajustó un ancho de banda que aísla los corredores viales e intersecciones con picos delictivos reales.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Transparencia Ajustada (65%):</strong> Permite visualizar simultáneamente el mapa base urbano de CartoDB (calles, avenidas y barrios) debajo de las iso-curvas de densidad.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
