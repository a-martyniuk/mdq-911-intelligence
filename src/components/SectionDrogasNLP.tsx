"use client";

import React, { useState, useMemo } from "react";
import { Brain, UserCheck, Home, MessageSquare, Search, AlertTriangle, ShieldAlert, Sparkles, Filter } from "lucide-react";

interface SectionDrogasNLPProps {
  incidents: any[];
}

export default function SectionDrogasNLP({ incidents = [] }: SectionDrogasNLPProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Extract Top Aliases and occurrences
  const aliasRanking = useMemo(() => {
    const counts: { [alias: string]: { count: number; lastDate: string; barrios: Set<string>; sampleRelato: string } } = {};

    incidents.forEach((inc) => {
      const aliases = inc.alias || [];
      aliases.forEach((a: string) => {
        const clean = a.trim();
        if (!clean) return;
        if (!counts[clean]) {
          counts[clean] = { count: 0, lastDate: inc.fecha, barrios: new Set(), sampleRelato: inc.relato };
        }
        counts[clean].count += 1;
        if (inc.barrio) counts[clean].barrios.add(inc.barrio);
      });
    });

    return Object.entries(counts)
      .map(([alias, data]) => ({
        alias,
        count: data.count,
        lastDate: data.lastDate,
        barrios: Array.from(data.barrios).join(", "),
        sampleRelato: data.sampleRelato,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [incidents]);

  // Points of sale distribution
  const lugaresStats = useMemo(() => {
    const map: { [key: string]: number } = {};
    incidents.forEach((r) => {
      const lug = r.tipoLugar || "Lugar No Especificado";
      map[lug] = (map[lug] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  // Filtered incidents with alias or search keyword
  const filteredIncidents = useMemo(() => {
    if (!searchTerm.trim()) {
      return incidents.filter((r) => (r.alias && r.alias.length > 0) || r.tieneArmas).slice(0, 25);
    }
    const q = searchTerm.toLowerCase();
    return incidents.filter((r) =>
      (r.relato || "").toLowerCase().includes(q) ||
      (r.direccion || "").toLowerCase().includes(q) ||
      (r.comentario || "").toLowerCase().includes(q) ||
      (r.alias || []).some((a: string) => a.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [incidents, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(139,92,246,0.05) 100%)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "10px", background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)", color: "#fff" }}>
            <Brain size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              🧬 Inteligencia de Redes, Alias & Modus Operandi Narcocriminal (NLP)
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Extracción algorítmica de apodos de transas, estructura de búnkers y léxico delictual en 1.770 despachos de José C. Paz.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Aliases + Puntos de Venta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Top Aliases Identified */}
        <div className="card">
          <div className="card-title" style={{ gap: "0.5rem" }}>
            <UserCheck size={18} color="var(--accent-indigo)" />
            <span>Alias y Nombres de Investigados Extraídos por NLP</span>
          </div>
          <p className="card-subtitle" style={{ marginBottom: "1rem" }}>
            Individuos mencionados reiteradamente en llamadas vecinales al 911 como encargados de la venta:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {aliasRanking.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-base)",
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    🏷️ {item.alias}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {item.barrios ? `📍 ${item.barrios}` : "📍 José C. Paz"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                    {item.count} denuncias
                  </span>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    Último reporte: {item.lastDate?.split(" ")[0]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Puntos de Venta & Señales Tácticas */}
        <div className="card">
          <div className="card-title" style={{ gap: "0.5rem" }}>
            <Home size={18} color="#10b981" />
            <span>Tipología de Espacios de Expendio</span>
          </div>
          <p className="card-subtitle" style={{ marginBottom: "1rem" }}>
            Clasificación del entorno físico denunciado por los vecinos:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
            {lugaresStats.map(([lugar, count], idx) => {
              const pct = (count / incidents.length) * 100;
              return (
                <div key={idx} style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "var(--text-primary)" }}>{lugar}</span>
                    <span style={{ color: "var(--accent-indigo)" }}>{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: "3px" }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-title" style={{ gap: "0.5rem", fontSize: "0.95rem" }}>
            <Sparkles size={16} color="#f59e0b" />
            <span>Señales Operativas & Modus Operandi Recurrente</span>
          </div>
          <ul style={{ paddingLeft: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.5rem 0 0" }}>
            <li><strong>Señas sonoras:</strong> Vecinos reportan señas ("silbar dos veces") para que el transa se acerque al portón o ventanita.</li>
            <li><strong>Música y permanencia:</strong> Búnkers con parlantes en la vereda para enmascarar conversaciones y permanencia de compradores.</li>
            <li><strong>Canje por ilícitos:</strong> Intercambio directo de rodados hurtados (bicicletas / motos) por dosis de paco o cocaína.</li>
          </ul>
        </div>
      </div>

      {/* Relatos Explorer with Live NLP Highlight */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <MessageSquare size={18} color="var(--accent-indigo)" />
              <span>Auditoría de Relatos Policiales 911 (NLP en Vivo)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
              Explorador de declaraciones textuales con detección de narcocriminalidad, armas y alias.
            </p>
          </div>

          <div style={{ width: "320px" }}>
            <input
              type="text"
              placeholder="Buscar por alias, búnker, cocaína, calle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", height: "36px", fontSize: "0.8rem" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "480px", overflowY: "auto", paddingRight: "0.5rem" }}>
          {filteredIncidents.map((inc, i) => (
            <div key={i} style={{ background: "var(--bg-base)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, marginBottom: "0.4rem" }}>
                <span style={{ color: "var(--accent-indigo)" }}>
                  ID 911 #{inc.id} | {inc.tipoLugar}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  {inc.fecha} ({inc.franja}) | {inc.barrio}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                  💊 {inc.sustancia}
                </span>
                {inc.tieneArmas && (
                  <span style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                    ⚠️ ARMAS / DISPAROS
                  </span>
                )}
                {inc.alias && inc.alias.map((a: string, aIdx: number) => (
                  <span key={aIdx} style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                    🏷️ {a}
                  </span>
                ))}
              </div>

              <div style={{ color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                📍 {inc.direccion} {inc.comentario ? `(${inc.comentario})` : ""}
              </div>

              <div style={{ background: "var(--bg-card)", padding: "0.6rem", borderRadius: "4px", border: "1px solid var(--border)", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {inc.relato}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
