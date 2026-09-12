"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Clock, Calendar, AlertTriangle, Download, FileText } from "lucide-react";
import { generateTemporalReportPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SectionTemporalProps {
  incidents: any[];
}

function normalizeDay(d: any): string {
  if (!d) return "";
  const s = String(d).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.startsWith("lun")) return "Lunes";
  if (s.startsWith("mar")) return "Martes";
  if (s.startsWith("mie")) return "Miércoles";
  if (s.startsWith("jue")) return "Jueves";
  if (s.startsWith("vie")) return "Viernes";
  if (s.startsWith("sab")) return "Sábado";
  if (s.startsWith("dom")) return "Domingo";
  return String(d);
}

export default function SectionTemporal({ incidents = [] }: SectionTemporalProps) {
  const safeIncidents = incidents || [];

  // Aggregate hourly data
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourlyCounts = hours.map((h) => safeIncidents.filter((r) => (r.Hora ?? r.hora) === h).length);

  // Aggregate day of week data
  const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const dailyCounts = daysOrder.map((d) => safeIncidents.filter((r) => normalizeDay(r.Dia_Semana || r.dia || r.diaSemana) === d).length);

  // 2D Crosstab Matrix (Day x Hour)
  const zMatrix = daysOrder.map((d) =>
    hours.map((h) => safeIncidents.filter((r) => normalizeDay(r.Dia_Semana || r.dia || r.diaSemana) === d && (r.Hora ?? r.hora) === h).length)
  );

  // Weekend vs Weekday
  const weekendCount = safeIncidents.filter((r) => r.Es_FinDeSemana || r.es_fin_de_semana || ["Sábado", "Domingo"].includes(normalizeDay(r.Dia_Semana || r.dia || r.diaSemana))).length;
  const weekdayCount = safeIncidents.length - weekendCount;

  // Dynamic Night Calculation
  const nightCases = safeIncidents.filter((r) => {
    const h = r.Hora ?? r.hora;
    return typeof h === "number" && h >= 18 && h <= 23;
  }).length;
  const nightPct = safeIncidents.length > 0 ? (nightCases / safeIncidents.length) * 100 : 0;

  return (
    <div className="animate-enter">
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title">
              <span>Análisis de Patrones Temporales y Nocturnidad</span>
            </div>
            <p className="card-subtitle">
              Distribución cronológica de incidentes 911 por hora del día, día de la semana y matriz de correlación temporal.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateTemporalReportPDF({
                  totalIncidents: safeIncidents.length,
                  hourlyCounts,
                  nightCases,
                  nightPct,
                  weekendCount,
                  weekdayCount
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} /> Informe Crono-Delictual (PDF)
            </button>

            <button
              onClick={() => {
                const exportData = hours.map((h) => ({
                  Hora: `${h.toString().padStart(2, '0')}:00`,
                  Incidentes: hourlyCounts[h],
                  Porcentaje: safeIncidents.length > 0 ? `${((hourlyCounts[h] / safeIncidents.length) * 100).toFixed(1)}%` : "0%",
                  Alerta_Nocturna: h >= 18 && h <= 23 ? "ALTA DENSIDAD NOCTURNA" : "Ordinario"
                }));
                exportToCSV("patrones_temporales_horarios_911", exportData);
              }}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} /> Exportar Horarios (Excel)
            </button>
          </div>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "var(--bg-base)",
          border: "1px solid var(--border)",
          borderLeft: "3px solid #f59e0b",
          borderRadius: "var(--radius-sm)",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem"
        }}>
          <AlertTriangle size={20} color="#f59e0b" />
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
              Hallazgo Crítico: Picos de Nocturnidad y Fin de Semana
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              La franja de <strong style={{ color: "var(--accent-indigo)" }}>18:00 a 24:00 hs concentra el {nightPct.toFixed(1)}% de los incidentes</strong> ({nightCases.toLocaleString()} casos). Asimismo, los <strong style={{ color: "var(--accent-pink)" }}>sábados por la noche</strong> registran la mayor densidad semanal de llamados al 911.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Chart 1: Hourly Distribution */}
          <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Incidentes por Hora del Día (00-23 hs)</h4>
            <Plot
              data={[
                {
                  x: hours.map((h) => `${h}:00`),
                  y: hourlyCounts,
                  type: "bar",
                  marker: {
                    color: hours.map((h) => (h >= 18 ? "#f59e0b" : "#3b82f6")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#94a3b8" },
                margin: { l: 40, r: 20, t: 20, b: 40 },
                xaxis: { gridcolor: "#1f2937" },
                yaxis: { gridcolor: "#1f2937" },
              } as any}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          {/* Chart 2: Day of Week */}
          <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Incidentes por Día de la Semana</h4>
            <Plot
              data={[
                {
                  x: daysOrder,
                  y: dailyCounts,
                  type: "bar",
                  marker: {
                    color: daysOrder.map((d) => (d === "Sábado" ? "#f59e0b" : "#3b82f6")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#94a3b8" },
                margin: { l: 40, r: 20, t: 20, b: 40 },
                xaxis: { gridcolor: "#1f2937" },
                yaxis: { gridcolor: "#1f2937" },
              } as any}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Chart 3: 2D Crosstab Heatmap */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Matriz de Calor Temporal 2D (Día de la Semana × Hora del Día)
          </h4>
          <Plot
            data={[
              {
                z: zMatrix,
                x: hours.map((h) => `${h}h`),
                y: daysOrder,
                type: "heatmap",
                colorscale: "YlOrRd",
              } as any,
            ]}
            layout={{
              autosize: true,
              height: 380,
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#94a3b8" },
              margin: { l: 80, r: 20, t: 20, b: 40 },
            } as any}
            useResizeHandler
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
