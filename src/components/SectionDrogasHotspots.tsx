"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Flame, Filter, Download, FileText, Info, ShieldAlert } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasJcpPDF } from "@/lib/pdfReport";
import "leaflet/dist/leaflet.css";

interface SectionDrogasHotspotsProps {
  incidents: any[];
}

export default function SectionDrogasHotspots({ incidents = [] }: SectionDrogasHotspotsProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterFranja, setFilterFranja] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");

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
        if (inc.tieneArmas !== want) return false;
      }
      return true;
    });
  }, [incidents, filterOrigen, filterSustancia, filterFranja, filterArmas]);

  // 1. Initialize Map ONCE
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.520, -58.775],
          zoom: 13,
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

  // 2. Dynamically render markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const group = markersGroupRef.current;
      if (!group) return;

      group.clearLayers();

      const points = filtered.filter((r) => r.lat && r.lng);

      points.forEach((inc) => {
        const isArmed = inc.tieneArmas;
        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius: isArmed ? 7 : 5,
          fillColor: isArmed ? "#ef4444" : "#f59e0b",
          color: "#ffffff",
          weight: 1.2,
          fillOpacity: 0.82,
        });

        marker.bindPopup(`
          <div style="font-size:0.8rem; line-height:1.4;">
            <strong style="color:#ef4444;">ID 911 #${inc.id} - ${inc.sustancia}</strong><br/>
            📍 ${inc.direccion || "José C. Paz"} (${inc.barrio || "Centro"})<br/>
            🕒 ${inc.fecha} (${inc.franja})<br/>
            ${inc.tieneArmas ? `<span style="color:#dc2626; font-weight:700;">⚠️ Armas / Disparos</span><br/>` : ""}
            <div style="background:#f8fafc; padding:0.4rem; border-radius:4px; margin-top:0.3rem; border:1px solid #cbd5e1; max-height:80px; overflow-y:auto;">
              ${inc.relato}
            </div>
          </div>
        `);

        marker.addTo(group);
      });
    });
  }, [filtered]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Flame color="#ef4444" size={24} />
              <span>🔥 Hotspots de Narcomenudeo & Concentración Territorial (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Visualización de núcleos de conflictividad narcocriminal y densidad de denuncias en vivo.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasJcpPDF({
                  totalIncidents: incidents.length,
                  georeferencedCount: filtered.filter((r) => r.lat && r.lng).length,
                  armasCount: filtered.filter((r) => r.tieneArmas).length,
                  cocainaCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("COCAÍNA")).length,
                  marihuanaCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("MARIHUANA")).length,
                  pacoCount: filtered.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
                  incidents: filtered,
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
                boxShadow: "0 2px 8px rgba(239,68,68,0.3)"
              }}
            >
              <FileText size={15} /> 📄 Descargar Informe Hotspots (PDF)
            </button>

            <button
              onClick={() => {
                const exportData = filtered.map((inc: any) => ({
                  ID: inc.id,
                  Fecha: inc.fecha,
                  Direccion: inc.direccion,
                  Barrio: inc.barrio,
                  Sustancia: inc.sustancia,
                  Tiene_Armas: inc.tieneArmas ? "SI" : "NO",
                  Franja: inc.franja,
                }));
                exportToCSV("hotspots_drogas_jose_c_paz", exportData);
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

        {/* Filters */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                📑 Vertiente / Fuente 911:
              </label>
              <select value={filterOrigen} onChange={(e) => setFilterOrigen(e.target.value)} className="form-input" style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}>
                <option value="todos">Todas las Fuentes (1.770 despachos)</option>
                <option value="DROGAS_ILICITAS_FORMAL">🔴 Despacho Formal Drogas (989 hechos)</option>
                <option value="INFORMACION_VECINAL_KEYWORDS">🟢 Búsqueda Semántica Relatos (781 hechos)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
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
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                ⏰ Franja Horaria:
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
              <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
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
        </div>

        <div ref={mapContainerRef} style={{ width: "100%", height: "650px", borderRadius: "8px", border: "1px solid var(--border)" }} />
      </div>
    </div>
  );
}
