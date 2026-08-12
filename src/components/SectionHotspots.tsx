"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Flame, Car, ShieldAlert, Info, Filter, Download, FileText, Clock, Calendar, Layers, MapPin, Eye } from "lucide-react";
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
function InteractiveHotspotsMap({ incidents = [] }: { incidents: any[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const map = L.map("interactive-hotspots-map", {
      center: [-37.995, -57.565],
      zoom: 12,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Layer: Comisarías (Blue Boundaries)
    L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
      style: { color: "#2563eb", weight: 1.8, fillColor: "#3b82f6", fillOpacity: 0.05 },
    }).addTo(map);

    // Layer: RENABAP (Orange Boundaries)
    L.geoJSON(RENABAP_BARRIOS_GEOJSON, {
      style: (feature: any) => ({
        color: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
        weight: feature.properties.isRenabap ? 2.5 : 1.2,
        dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
        fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
        fillOpacity: feature.properties.isRenabap ? 0.3 : 0.06,
      }),
    }).addTo(map);

    // Plot dynamic filtered incident markers / heat points
    const pointsToPlot = incidents.slice(0, 1500); // Top 1500 filtered for crisp rendering

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
          <div style="background:#f8fafc; padding:0.4rem; border-radius:4px; margin-top:0.3rem; border:1px solid #cbd5e1; max-height:80px; overflow-y:auto;">
            ${(inc.Relato || inc.relato || "Sin relato").slice(0, 140)}...
          </div>
        </div>
      `);

      marker.addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [L, incidents]);

  return <div id="interactive-hotspots-map" style={{ width: "100%", height: "650px", borderRadius: "8px" }} />;
}

export default function SectionHotspots({ incidents = [], geoPoints = [] }: SectionHotspotsProps) {
  const [activeTab, setActiveTab] = useState<"general" | "robos" | "armas">("general");

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
        const franja = (inc.Franja_Horaria || inc.franja || "").toLowerCase();
        if (!franja.includes(filterFranja.toLowerCase())) return false;
      }

      // Filter by Día de la Semana
      if (filterDia !== "todos") {
        const dia = (inc.Dia_Semana || inc.dia || "").toLowerCase();
        if (!dia.includes(filterDia.toLowerCase())) return false;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Main Card Header */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Flame color="#ef4444" size={24} />
              <span>🔥 Hotspots Delictivos y Mapa de Densidad Kernel (KDE)</span>
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
                  incidents: filteredIncidents.length > 0 ? filteredIncidents : dataset,
                  filterSummary,
                });
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
              }}
            >
              <FileText size={15} /> 📄 Exportar Informe PDF Hotspots
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
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Download size={15} /> 📊 Exportar Muestra Excel
            </button>
          </div>
        </div>

        {/* Dynamic Filters Control Panel */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            <Filter size={16} color="var(--accent-indigo)" />
            <span>Filtros Multidimensionales de Hotspots:</span>
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
                className="btn-logout"
                style={{ height: "36px", padding: "0 0.75rem", fontSize: "0.75rem", fontWeight: 700, width: "100%" }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tab Presets & Map View Mode Selector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              className={`btn-logout ${activeTab === "general" ? "active" : ""}`}
              style={activeTab === "general" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
              onClick={() => {
                setActiveTab("general");
                setFilterTipo("todos");
              }}
            >
              <Flame size={16} /> Densidad General (8.598 Casos)
            </button>

            <button
              className={`btn-logout ${activeTab === "robos" ? "active" : ""}`}
              style={activeTab === "robos" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
              onClick={() => {
                setActiveTab("robos");
                setFilterTipo("robos");
              }}
            >
              <Car size={16} /> Hotspots de Robos Vehiculares
            </button>

            <button
              className={`btn-logout ${activeTab === "armas" ? "active" : ""}`}
              style={activeTab === "armas" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
              onClick={() => {
                setActiveTab("armas");
                setFilterTipo("armas");
              }}
            >
              <ShieldAlert size={16} /> Hotspots Armas & Disparos
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              onClick={() => setMapMode("interactive")}
              className={`btn-logout ${mapMode === "interactive" ? "active" : ""}`}
              style={mapMode === "interactive" ? { background: "#10b981", color: "#fff" } : undefined}
            >
              🗺️ Mapa Dinámico (Filtros en Vivo)
            </button>

            <button
              onClick={() => setMapMode("kde_hd")}
              className={`btn-logout ${mapMode === "kde_hd" ? "active" : ""}`}
              style={mapMode === "kde_hd" ? { background: "#8b5cf6", color: "#fff" } : undefined}
            >
              🖼️ Capa KDE HD Pre-Calculada
            </button>
          </div>
        </div>

        {/* Map Container View */}
        <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {mapMode === "interactive" ? (
            <InteractiveHotspotsMap incidents={filteredIncidents} />
          ) : (
            <>
              {activeTab === "general" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_densidad.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Hotspots General"
                />
              )}
              {activeTab === "robos" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_robos.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Hotspots Robos"
                />
              )}
              {activeTab === "armas" && (
                <iframe
                  src={getApiUrl("/api/raw_html/05_mapa_hotspots_armas_disparos.html")}
                  style={{ width: "100%", height: "650px", border: "none" }}
                  title="Hotspots Armas"
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
