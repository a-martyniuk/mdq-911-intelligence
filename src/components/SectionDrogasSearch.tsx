"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, Download, AlertTriangle, Shield, MapPin, Eye, FileText } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";

interface SectionDrogasSearchProps {
  incidents: any[];
}

export default function SectionDrogasSearch({ incidents = [] }: SectionDrogasSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSustancia, setFilterSustancia] = useState("todos");
  const [filterArmas, setFilterArmas] = useState("todos");
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);

  const filtered = useMemo(() => {
    let result = incidents;

    if (filterSustancia !== "todos") {
      const s = filterSustancia.toUpperCase();
      result = result.filter((r) => (r.sustancia || "").toUpperCase().includes(s));
    }

    if (filterArmas !== "todos") {
      const wantArmas = filterArmas === "si";
      result = result.filter((r) => r.tieneArmas === wantArmas);
    }

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      result = result.filter((r) =>
        (r.relato || "").toLowerCase().includes(q) ||
        (r.direccion || "").toLowerCase().includes(q) ||
        (r.comentario || "").toLowerCase().includes(q) ||
        (r.id?.toString() || "").includes(q) ||
        (r.alias || []).some((a: string) => a.toLowerCase().includes(q))
      );
    }

    return result;
  }, [incidents, searchTerm, filterSustancia, filterArmas]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Search size={22} color="var(--accent-indigo)" />
              <span>🔍 Buscador Universal de Denuncias 911 (José C. Paz)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Auditoría y consulta pericial de llamadas vecinales de narcotráfico en tiempo real.
            </p>
          </div>

          <button
            onClick={() => {
              const exportData = filtered.map((inc) => ({
                ID: inc.id,
                Fecha: inc.fecha,
                Direccion: inc.direccion,
                Barrio: inc.barrio,
                Sustancia: inc.sustancia,
                Lugar: inc.tipoLugar,
                Tiene_Armas: inc.tieneArmas ? "SI" : "NO",
                Alias: (inc.alias || []).join(" | "),
                Relato: inc.relato,
              }));
              exportToCSV("auditoria_911_jose_c_paz", exportData);
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
            <Download size={15} /> 📊 Exportar Resultados ({filtered.length.toLocaleString()})
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 200px", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Buscar por ID, calle, alias (ej: Peter, El Mono), búnker, vehículo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", height: "38px", fontSize: "0.85rem" }}
            />

            <select
              value={filterSustancia}
              onChange={(e) => setFilterSustancia(e.target.value)}
              className="form-input"
              style={{ width: "100%", height: "38px", fontSize: "0.8rem" }}
            >
              <option value="todos">Todas las Sustancias</option>
              <option value="COCAÍNA">Cocaína</option>
              <option value="PACO">Paco / Pasta Base</option>
              <option value="MARIHUANA">Marihuana</option>
            </select>

            <select
              value={filterArmas}
              onChange={(e) => setFilterArmas(e.target.value)}
              className="form-input"
              style={{ width: "100%", height: "38px", fontSize: "0.8rem" }}
            >
              <option value="todos">Todas las Denuncias</option>
              <option value="si">Con Armas / Disparos</option>
              <option value="no">Sin mención de armas</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>Mostrando {filtered.length.toLocaleString()} de {incidents.length.toLocaleString()} denuncias 911 coincidentes</span>
            <span style={{ color: "var(--accent-indigo)" }}>Hacé clic en cualquier fila para inspeccionar el relato completo</span>
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "550px", overflowY: "auto", paddingRight: "0.4rem" }}>
          {filtered.slice(0, 100).map((inc, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedIncident(inc)}
              style={{
                background: selectedIncident?.id === inc.id ? "rgba(99,102,241,0.12)" : "var(--bg-base)",
                border: selectedIncident?.id === inc.id ? "1.5px solid var(--accent-indigo)" : "1px solid var(--border)",
                padding: "0.85rem 1rem",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ color: "var(--text-primary)", fontSize: "0.85rem" }}>
                    ID 911 #{inc.id}
                  </strong>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                    {inc.sustancia}
                  </span>
                  {inc.tieneArmas && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(220,38,38,0.2)", color: "#f87171" }}>
                      ⚠️ ARMADO
                    </span>
                  )}
                </div>

                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {inc.fecha} ({inc.franja})
                </span>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                📍 {inc.direccion} | 🏘️ {inc.barrio} | 🏠 {inc.tipoLugar}
                {inc.alias && inc.alias.length > 0 && (
                  <span style={{ color: "#f59e0b", fontWeight: 700, marginLeft: "0.5rem" }}>
                    🏷️ Alias: {inc.alias.join(", ")}
                  </span>
                )}
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: selectedIncident?.id === inc.id ? "normal" : "nowrap" }}>
                {inc.relato}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
