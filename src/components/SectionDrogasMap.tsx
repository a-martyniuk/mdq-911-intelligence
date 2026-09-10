"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, Filter, Download, Skull, Crosshair, ShieldAlert, Layers, Home, Info, Eye, FileText } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasJcpPDF } from "@/lib/pdfReport";
import "leaflet/dist/leaflet.css";

interface SectionDrogasMapProps {
  incidents: any[];
}

export default function SectionDrogasMap({ incidents = [] }: SectionDrogasMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Filters State
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterLugar, setFilterLugar] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");
  const [filterBarrio, setFilterBarrio] = useState<string>("todos");

  // Filtered dataset
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
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
        const sust = (inc.sustancia || inc.SubTipo || "").toUpperCase();
        if (!sust.includes(filterSustancia.toUpperCase())) return false;
      }
      if (filterLugar !== "todos") {
        const lug = (inc.tipoLugar || inc.Tipo_Punto_Venta || "").toUpperCase();
        if (!lug.includes(filterLugar.toUpperCase())) return false;
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
      if (b && b !== "José C. Paz (Centro / General)") setB.add(b);
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

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // 2. Dynamically update markers without destroying the map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const markersGroup = markersGroupRef.current;
      if (!markersGroup) return;

      markersGroup.clearLayers();

      const points = filteredIncidents.filter((r) => r.lat && r.lng);

      points.forEach((inc) => {
        const sust = (inc.sustancia || "").toUpperCase();
        const hasArmas = inc.tieneArmas;

        let color = "#3b82f6";
        if (sust.includes("PACO")) {
          color = "#ec4899";
        } else if (sust.includes("COCAÍNA")) {
          color = "#ef4444";
        } else if (sust.includes("MARIHUANA")) {
          color = "#10b981";
        } else if (hasArmas) {
          color = "#f59e0b";
        }

        const radius = inc.tipoLugar?.includes("Búnker") ? 7.5 : inc.tipoLugar?.includes("Ventanita") ? 6.5 : 5;

        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius: radius,
          fillColor: color,
          color: "#ffffff",
          weight: 1.2,
          fillOpacity: 0.85,
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
            <div style="background:#f8fafc; padding:6px; border-radius:4px; margin-top:6px; border:1px solid #cbd5e1; font-size:0.75rem; max-height:85px; overflow-y:auto; color:#334155;">
              ${inc.relato}
            </div>
          </div>
        `);

        marker.addTo(markersGroup);
      });
    });
  }, [filteredIncidents]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Card */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <MapPin color="#ef4444" size={24} />
              <span>🗺️ Mapa Táctico de Puntos de Venta & Búnkers (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Localización espacial de búnkers, ventanitas de comercialización y puntos de narcomenudeo con filtros multidimensionales.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasJcpPDF({
                  totalIncidents: incidents.length,
                  georeferencedCount: filteredIncidents.filter((r) => r.lat && r.lng).length,
                  armasCount: filteredIncidents.filter((r) => r.tieneArmas).length,
                  cocainaCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCAÍNA")).length,
                  marihuanaCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARIHUANA")).length,
                  pacoCount: filteredIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
                  incidents: filteredIncidents,
                });
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 1rem",
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
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              }}
            >
              <FileText size={15} /> 📄 Descargar Informe Táctico (PDF)
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
                  Relato: inc.relato,
                }));
                exportToCSV("puntos_venta_drogas_jose_c_paz", exportData);
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
                gap: "0.4rem",
              }}
            >
              <Download size={15} /> 📊 Exportar Datos Filtrados
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            <Filter size={16} color="var(--accent-indigo)" />
            <span>Filtros Operativos:</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
              Mostrando <strong>{filteredIncidents.length.toLocaleString()}</strong> de {incidents.length.toLocaleString()} denuncias totales
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
            {/* Vertiente / Fuente 911 */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                📑 Vertiente / Fuente 911:
              </label>
              <select
                value={filterOrigen}
                onChange={(e) => setFilterOrigen(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todas las Fuentes (1.770 despachos - 1.549 con mapa)</option>
                <option value="DROGAS_ILICITAS_FORMAL">🔴 Despacho Formal Drogas (989 - 866 con mapa)</option>
                <option value="INFORMACION_VECINAL_KEYWORDS">🟢 Búsqueda Semántica Relatos (781 - 683 con mapa)</option>
              </select>
            </div>

            {/* Sustancia */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                💊 Sustancia:
              </label>
              <select
                value={filterSustancia}
                onChange={(e) => setFilterSustancia(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todas las Sustancias</option>
                <option value="COCAÍNA">🔴 Cocaína</option>
                <option value="PACO">🟣 Paco / Pasta Base</option>
                <option value="MARIHUANA">🟢 Marihuana</option>
              </select>
            </div>

            {/* Lugar */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🏠 Tipo de Punto de Venta:
              </label>
              <select
                value={filterLugar}
                onChange={(e) => setFilterLugar(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todos los Lugares</option>
                <option value="Búnker">Búnker / Casilla / Baldío</option>
                <option value="Ventanita">Ventanita / Kiosco</option>
                <option value="Pasillo">Pasillo de Asentamiento</option>
                <option value="Vía Pública">Vía Pública / Esquina</option>
                <option value="Finca">Finca / Vivienda</option>
              </select>
            </div>

            {/* Armas */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🔫 Conflictividad Armada:
              </label>
              <select
                value={filterArmas}
                onChange={(e) => setFilterArmas(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todas las Situaciones</option>
                <option value="si">⚠️ Con Armas / Disparos</option>
                <option value="no">Sin mención de armas</option>
              </select>
            </div>

            {/* Barrio */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                🏘️ Barrio Detectado:
              </label>
              <select
                value={filterBarrio}
                onChange={(e) => setFilterBarrio(e.target.value)}
                className="form-input"
                style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
              >
                <option value="todos">Todos los Barrios</option>
                {barriosList.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Reset */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => {
                  setFilterOrigen("todos");
                  setFilterSustancia("todos");
                  setFilterLugar("todos");
                  setFilterArmas("todos");
                  setFilterBarrio("todos");
                }}
                className="btn-logout"
                style={{ height: "36px", padding: "0 0.75rem", fontSize: "0.75rem", fontWeight: 700, width: "100%" }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}></span> Cocaína
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ec4899" }}></span> Paco / Pasta Base
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}></span> Marihuana
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}></span> Armado / Disparos
          </span>
        </div>

        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "650px", borderRadius: "8px", border: "1px solid var(--border)", zIndex: 1 }}
        />
      </div>
    </div>
  );
}
