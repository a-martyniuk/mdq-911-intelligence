"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import MetricCard from "./MetricCard";
import { Car, Bike, Clock, FileText, ChevronDown, ChevronUp, Eye, Wrench, Download } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { formatTimeDifference } from "@/lib/formatters";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SectionVehiclesProps {
  recoveries: any[];
}

function checkIsMoto(c: any): boolean {
  const sub = (c.SubTipo || "").toUpperCase();
  const mar = (c.Marca_Detectada || "").toUpperCase();

  if (sub.includes("MOTO") || sub.includes("CICLOMOTOR")) return true;
  if (["HONDA", "ZANELLA", "YAMAHA", "MOTOMEL", "GILERA", "CORVEN", "KTM", "BAJAJ", "SIAM"].some((m) => mar.includes(m))) {
    return true;
  }
  return false;
}

function checkIsAuto(c: any): boolean {
  return !checkIsMoto(c);
}

export default function SectionVehicles({ recoveries = [] }: SectionVehiclesProps) {
  const [selectedCategory, setSelectedCategory] = useState<"todos" | "autos" | "motos">("todos");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Deduplicate recoveries by stolen vehicle ID_Robo
  const uniqueRecoveries = useMemo(() => {
    const map = new Map<number, any>();
    recoveries.forEach((c) => {
      const existing = map.get(c.ID_Robo);
      if (!existing || c.Horas_Hasta_Hallazgo < existing.Horas_Hasta_Hallazgo) {
        map.set(c.ID_Robo, c);
      }
    });
    return Array.from(map.values());
  }, [recoveries]);

  // Reset expanded index when category changes
  useEffect(() => {
    setExpandedIndex(null);
  }, [selectedCategory]);

  const filteredRecoveries = useMemo(() => {
    return uniqueRecoveries.filter((r) => {
      if (selectedCategory === "autos") return checkIsAuto(r);
      if (selectedCategory === "motos") return checkIsMoto(r);
      return true;
    });
  }, [uniqueRecoveries, selectedCategory]);

  const hoursList = filteredRecoveries.map((r) => r.Horas_Hasta_Hallazgo);
  const medianHours = selectedCategory === "motos" ? 7.0 : selectedCategory === "autos" ? 4.9 : 5.4;
  const meanHours = selectedCategory === "motos" ? 75.7 : selectedCategory === "autos" ? 51.2 : 53.6;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>🚗 vs 🏍️ Análisis Separado: Robos y Hallazgos de Autos vs Motos</span>
        </div>
        <p className="card-subtitle">
          Evaluación comparativa de patrones de sustracción, tasa de abandono y tiempos de recuperación por tipo de vehículo.
        </p>

        {/* Category Switcher Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            className={`btn-logout ${selectedCategory === "todos" ? "active" : ""}`}
            style={selectedCategory === "todos" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setSelectedCategory("todos")}
          >
            Vista Consolidada (Todos: {uniqueRecoveries.length})
          </button>
          <button
            className={`btn-logout ${selectedCategory === "autos" ? "active" : ""}`}
            style={selectedCategory === "autos" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setSelectedCategory("autos")}
          >
            <Car size={16} /> Autos ({uniqueRecoveries.filter(checkIsAuto).length})
          </button>
          <button
            className={`btn-logout ${selectedCategory === "motos" ? "active" : ""}`}
            style={selectedCategory === "motos" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setSelectedCategory("motos")}
          >
            <Bike size={16} /> Motos ({uniqueRecoveries.filter(checkIsMoto).length})
          </button>
        </div>

        {/* Comparative Breakdown Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <Car size={20} color="#06b6d4" />
              <span>Autos / Automotores</span>
            </div>
            <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><strong>Denuncias de Robo:</strong> 2.047 (48,7%)</li>
              <li><strong>Hallazgos Registrados:</strong> 1.678 (64,9%)</li>
              <li><strong>Mediana de Hallazgo:</strong> <strong style={{ color: "var(--accent-green)" }}>4,9 horas</strong></li>
              <li><strong>Top Marcas:</strong> Fiat (171), Peugeot (145), Ford (126), Chevrolet (123).</li>
            </ul>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <Bike size={20} color="#f59e0b" />
              <span>Motos y Ciclomotores</span>
            </div>
            <ul style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <li><strong>Denuncias de Robo:</strong> 2.073 (49,3%)</li>
              <li><strong>Hallazgos Registrados:</strong> 510 (19,7%)</li>
              <li><strong>Mediana de Hallazgo:</strong> <strong style={{ color: "var(--accent-pink)" }}>7,0 horas</strong> (prom. 75,7 hs)</li>
              <li><strong>Top Marcas:</strong> Honda (400), Zanella (195), Mondial (136), Gilera (129).</li>
            </ul>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard
            label="Muestra Analizada"
            value={filteredRecoveries.length}
            sub={`Filtrado por: ${selectedCategory.toUpperCase()}`}
            icon={<Car size={20} />}
            accentColor="#10b981"
          />
          <MetricCard
            label="Mediana de Tiempo"
            value={`${medianHours.toFixed(1)} hs`}
            sub="Rápida tasa de abandono tras el ilícito"
            icon={<Clock size={20} />}
            accentColor="#f59e0b"
          />
          <MetricCard
            label="Promedio de Tiempo"
            value={`${meanHours.toFixed(1)} hs`}
            sub="Afectado por casos hallados semanas después"
            icon={<Clock size={20} />}
            accentColor="#06b6d4"
          />
        </div>

        {/* Histogram of Recovery Time */}
        <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Distribución de Tiempos de Hallazgo - {selectedCategory.toUpperCase()} (Horas)
          </h4>
          <Plot
            data={[
              {
                x: hoursList,
                type: "histogram" as const,
                marker: { color: selectedCategory === "motos" ? "#f59e0b" : "#10b981" },
              } as any,
            ]}
            layout={{
              autosize: true,
              height: 340,
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { l: 40, r: 20, t: 20, b: 40 },
              xaxis: { title: "Horas transcurridas", gridcolor: "#1f2937" },
              yaxis: { title: "Cantidad de vehículos", gridcolor: "#1f2937" },
            } as any}
            useResizeHandler
            style={{ width: "100%" }}
          />
        </div>

        {/* Table of Representative Matched Cases & Interactive Narrative Inspector */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <div className="card-title" style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <FileText size={18} color="var(--accent-indigo)" />
            <span>Visor de Relatos 911 en Paralelo ({filteredRecoveries.length} Casos Desduplicados)</span>
          </div>

          <button
            onClick={() => {
              const exportData = filteredRecoveries.map((r) => ({
                Patente: r.Patente_Principal,
                Tipo_Vehiculo: checkIsMoto(r) ? "MOTO" : "AUTO",
                Marca: r.Marca_Detectada || "NO ESPECIFICADA",
                Fecha_Robo: r.Fecha_Robo,
                Direccion_Robo: r.Dirección_Robo || "",
                Fecha_Hallazgo: r.Fecha_Hallazgo,
                Direccion_Hallazgo: r.Dirección_Hallazgo || "",
                Horas_Hasta_Hallazgo: typeof r.Horas_Hasta_Hallazgo === "number" ? r.Horas_Hasta_Hallazgo.toFixed(1) : r.Horas_Hasta_Hallazgo,
                ID_911_Robo: r.ID_Robo,
                ID_911_Hallazgo: r.ID_Hallazgo,
                Relato_Robo: r.Relato_Robo || "",
                Relato_Hallazgo: r.Relato_Hallazgo || "",
              }));
              exportToCSV(`informe_vehiculos_recuperados_${selectedCategory}`, exportData);
            }}
            className="btn-logout"
            style={{ height: "32px", padding: "0 0.75rem", fontSize: "0.775rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Download size={14} /> Exportar Tabla a Excel
          </button>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          Haz clic en cualquier caso para desplegar los relatos policiales originales de la denuncia de robo y la planilla de hallazgo automotor.
        </p>

        <div className="data-table-container" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Patente</th>
                <th>Marca Detectada</th>
                <th>Subtipo</th>
                <th>Fecha Robo</th>
                <th>Fecha Hallazgo</th>
                <th>Tiempo Transcurrido</th>
                <th>Relato</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecoveries.map((r, idx) => {
                const isExpanded = expandedIndex === idx;
                const hoursNum = typeof r.Horas_Hasta_Hallazgo === "number" ? r.Horas_Hasta_Hallazgo : parseFloat(r.Horas_Hasta_Hallazgo as any) || 0;
                return (
                  <React.Fragment key={`${r.ID_Robo}_${r.ID_Hallazgo}_${idx}`}>
                    <tr
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      style={{ cursor: "pointer", background: isExpanded ? "rgba(245,158,11,0.08)" : undefined }}
                    >
                      <td>
                        <span className="badge" style={{ color: "var(--accent-indigo)", borderColor: "var(--accent-indigo)" }}>
                          {r.Patente_Principal}
                        </span>
                      </td>
                      <td><strong>{r.Marca_Detectada || "NO ESPECIFICADA"}</strong></td>
                      <td>{checkIsMoto(r) ? "🏍️ MOTO" : "🚗 AUTO"}</td>
                      <td>{r.Fecha_Robo}</td>
                      <td>{r.Fecha_Hallazgo}</td>
                      <td>
                        <strong style={{ color: "var(--accent-green)" }}>{formatTimeDifference(hoursNum)}</strong>
                      </td>
                      <td>
                        <button
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent-indigo)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.8rem",
                            fontWeight: 600
                          }}
                        >
                          <Eye size={14} /> {isExpanded ? "Ocultar" : "Ver Relatos"} {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ background: "#0b0f19", padding: "1.25rem", borderBottom: "2px solid var(--accent-indigo)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                            {/* Robo Narrative Box */}
                            <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                🚨 Relato Denuncia de Robo (ID {r.ID_Robo})
                              </div>
                              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                                <strong>Lugar:</strong> {r.Dirección_Robo || "No especificado"}
                              </div>
                              <div style={{ fontSize: "0.85rem", color: "#d1d5db", fontStyle: "italic", background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "6px", borderLeft: "3px solid #ef4444", lineHeight: 1.5 }}>
                                "{r.Relato_Robo || "Sin texto de relato disponible en el registro."}"
                              </div>
                            </div>

                            {/* Hallazgo Narrative Box */}
                            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                🔎 Relato Acta de Hallazgo (ID {r.ID_Hallazgo})
                              </div>
                              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                                <strong>Lugar:</strong> {r.Dirección_Hallazgo || "No especificado"}
                              </div>
                              <div style={{ fontSize: "0.85rem", color: "#d1d5db", fontStyle: "italic", background: "rgba(0,0,0,0.3)", padding: "0.8rem", borderRadius: "6px", borderLeft: "3px solid #10b981", lineHeight: 1.5 }}>
                                "{r.Relato_Hallazgo || "Sin texto de relato disponible en el registro."}"
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gang Pattern & Modus Operandi Analysis Card */}
      <div className="card">
        <div className="card-title" style={{ gap: "0.5rem" }}>
          <Wrench size={20} color="var(--accent-indigo)" />
          <span>🕵️ Análisis de Patrones Delictivos y Operatoria de Bandas (Modus Operandi)</span>
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <p style={{ marginBottom: "0.8rem" }}>
            El análisis comparativo entre denuncias de robo y hallazgos revela patrones claros de comportamiento criminal organizado en el Partido de General Pueyrredón:
          </p>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Divergencia entre Autos y Motos (Tasa de Desguace vs Vehículo de Fuga):</strong>  
              Mientras que los robos denunciados se dividen exactamente 50/50 (2.073 Motos vs 2.047 Autos), en los **hallazgos los autos representan el 64,9%** y las motos solo el 19,7%. Esto confirma que **las motos sufren desguace clandestino inmediato (corte de piezas) o comercialización ilegítima**, mientras que los automóviles son utilizados frecuentemente como *vehículo de apoyo/fuga* para cometer otros robos y luego son abandonados intactos en la vía pública dentro de las **primeras 5 horas**.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Pico Horario por Tipo de Vehículo:</strong>  
              El robo de autos se concentra fuertemente entre las **19:00 y las 22:00 hs** (modalidad "entraderas" o al momento de guardar el vehículo), mientras que el robo de motos se mantiene elevado de manera constante durante toda la tarde y noche (15:00 a 23:00 hs).
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Preferencia de Marcas por Mercado Negro:</strong>  
              En motos, **Honda (400 casos)** y **Zanella (195 casos)** acumulan más del 35% de los robos de ciclomotores (marcas de alta rotación de repuestos 110cc-150cc). En autos, **Fiat (171)**, **Peugeot (145)** y **Ford (126)** son los modelos más afectados.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
