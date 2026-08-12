"use client";

import React, { useState, useMemo } from "react";
import { Search, Filter, ShieldAlert, Car, MapPin, Clock, Tag, Download } from "lucide-react";
import { extractEntities, highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";

interface SectionSearchProps {
  incidents: any[];
  onSelectMapCoordinate?: (lat: number, lng: number) => void;
}

export default function SectionSearch({ incidents = [] }: SectionSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<"todos" | "armas" | "patentes" | "marcas" | "modus">("todos");

  // Search and entity filter pipeline
  const filteredIncidents = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];

    let results = incidents;

    // Filter by entity type if selected
    if (entityFilter !== "todos") {
      results = results.filter((inc) => {
        const relato = inc.Relato || inc.relato || "";
        const entities = extractEntities(relato);

        if (entityFilter === "armas") return entities.weapons.length > 0;
        if (entityFilter === "patentes") return entities.patentes.length > 0 || !!inc.Patente_Principal;
        if (entityFilter === "marcas") return entities.brands.length > 0 || (inc.Marca_Detectada && inc.Marca_Detectada !== "NO ESPECIFICADO");
        if (entityFilter === "modus") return entities.modusOperandi.length > 0;
        return true;
      });
    }

    // Full text search with accent-insensitive normalization
    if (searchTerm.trim()) {
      const normalizeStr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const q = normalizeStr(searchTerm.trim());

      results = results.filter((inc) => {
        const relato = normalizeStr(inc.Relato || inc.relato || "");
        const tipo = normalizeStr(inc.Tipo || "");
        const subtipo = normalizeStr(inc.SubTipo || "");
        const direccion = normalizeStr(inc.Dirección || "");
        const patente = normalizeStr(inc.Patente_Principal || "");
        const marca = normalizeStr(inc.Marca_Detectada || "");

        return (
          relato.includes(q) ||
          tipo.includes(q) ||
          subtipo.includes(q) ||
          direccion.includes(q) ||
          patente.includes(q) ||
          marca.includes(q)
        );
      });
    }

    return results;
  }, [incidents, searchTerm, entityFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(168,85,247,0.05) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-indigo)", color: "#fff" }}>
            <Search size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Buscador Universal de Patentes & Auditoría 911
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Motor de auditoría rápida sobre relatos policiales de despacho. Extrae armas, patentes y modus operandi en tiempo real.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar patente (ej: AA123BB), marca (ej: Honda), arma (ej: 9mm) o calle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: "2.75rem", width: "100%", height: "42px", fontSize: "0.9rem" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Filter size={16} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>Entidad:</span>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {(["todos", "armas", "patentes", "marcas", "modus"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setEntityFilter(mode)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    background: entityFilter === mode ? "var(--accent-indigo)" : "var(--bg-card)",
                    color: entityFilter === mode ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {mode === "todos" ? "Todas" : mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics & Export Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        <span>
          Mostrando <strong style={{ color: "var(--text-primary)" }}>{filteredIncidents.length}</strong> incidentes coincidentes de {incidents.length} totales
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ background: "none", border: "none", color: "var(--accent-indigo)", cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}
            >
              Limpiar búsqueda
            </button>
          )}

          <button
            onClick={() => {
              const exportData = filteredIncidents.map((inc) => ({
                ID_911: inc.ID,
                Tipo: inc.Tipo,
                SubTipo: inc.SubTipo,
                Fecha: inc.Fecha,
                Hora: inc.Hora,
                Franja_Horaria: inc.Franja_Horaria,
                Dia_Semana: inc.Dia_Semana,
                Direccion: inc.Dirección || "",
                Patente_Detectada: inc.Patente_Principal || "",
                Marca_Detectada: inc.Marca_Detectada || "",
                Relato_911: inc.Relato || inc.relato || "",
              }));
              exportToCSV("informe_busqueda_universal_911", exportData);
            }}
            className="btn-logout"
            style={{ height: "32px", padding: "0 0.75rem", fontSize: "0.775rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Download size={14} /> Exportar Resultados a Excel
          </button>
        </div>
      </div>

      {/* Incidents List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "1rem" }}>
        {filteredIncidents.slice(0, 50).map((inc, i) => {
          const relatoText = inc.Relato || inc.relato || "";
          const entities = extractEntities(relatoText);

          return (
            <div key={inc.ID || i} className="card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderLeft: "4px solid var(--accent-indigo)" }}>
              {/* Card Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-indigo)", background: "rgba(99,102,241,0.15)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      ID #{inc.ID}
                    </span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                      {inc.Tipo} - {inc.SubTipo}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0.4rem 0 0", color: "var(--text-primary)" }}>
                    {inc.Dirección || "Dirección no especificada"}
                  </h4>
                </div>

                {inc.Patente_Principal && (
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.05em", padding: "0.2rem 0.5rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                    🏷️ {inc.Patente_Principal}
                  </span>
                )}
              </div>

              {/* Entity Badges Summary */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {inc.Marca_Detectada && inc.Marca_Detectada !== "NO ESPECIFICADO" && (
                  <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(59, 130, 246, 0.15)", color: "#93c5fd" }}>
                    🚘 {inc.Marca_Detectada}
                  </span>
                )}
                {entities.weapons.map((w, idx) => (
                  <span key={idx} style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5" }}>
                    🔫 {w}
                  </span>
                ))}
                {entities.modusOperandi.map((m, idx) => (
                  <span key={idx} style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(245, 158, 11, 0.15)", color: "#fde047" }}>
                    ⚡ {m}
                  </span>
                ))}
              </div>

              {/* Highlighted Relato Box */}
              <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.5, background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", maxHeight: "140px", overflowY: "auto" }}>
                {highlightRelato(relatoText)}
              </div>

              {/* Card Footer Meta */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", paddingTop: "0.4rem", borderTop: "1px solid var(--border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <Clock size={12} /> {inc.Fecha} ({inc.Franja_Horaria})
                </span>
                {inc.Latitud_Clean && inc.Longitud_Clean && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "var(--accent-indigo)" }}>
                    <MapPin size={12} /> Georeferenciado
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredIncidents.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
          <ShieldAlert size={36} style={{ color: "var(--accent-amber)", margin: "0 auto 0.75rem" }} />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            No se encontraron incidentes que coincidan con la búsqueda
          </h3>
          <p style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Prueba ajustando el término de búsqueda o cambiando el filtro de entidad.
          </p>
        </div>
      )}
    </div>
  );
}
