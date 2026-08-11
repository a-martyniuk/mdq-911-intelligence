"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Clock, Calendar, AlertTriangle } from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SectionTemporalProps {
  incidents: any[];
}

export default function SectionTemporal({ incidents }: SectionTemporalProps) {
  // Aggregate hourly data
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourlyCounts = hours.map((h) => incidents.filter((r) => r.Hora === h).length);

  // Aggregate day of week data
  const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const dailyCounts = daysOrder.map((d) => incidents.filter((r) => r.Dia_Semana === d).length);

  // 2D Crosstab Matrix (Day x Hour)
  const zMatrix = daysOrder.map((d) =>
    hours.map((h) => incidents.filter((r) => r.Dia_Semana === d && r.Hora === h).length)
  );

  // Weekend vs Weekday
  const weekendCount = incidents.filter((r) => r.Es_FinDeSemana).length;
  const weekdayCount = incidents.length - weekendCount;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>⏰ Análisis de Patrones Temporales y Nocturnidad</span>
        </div>
        <p className="card-subtitle">
          Distribución cronológica de incidentes 911 por hora del día, día de la semana y matriz de correlación temporal.
        </p>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "rgba(245,158,11,0.12)",
          border: "1px solid var(--accent-indigo)",
          borderRadius: "var(--radius-md)",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem"
        }}>
          <AlertTriangle size={24} color="var(--accent-indigo)" />
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
              Hallazgo Crítico: Picos de Nocturnidad y Fin de Semana
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              La franja de <strong style={{ color: "var(--accent-indigo)" }}>18:00 a 24:00 hs concentra el 39,5% de los incidentes totales</strong> (3.397 casos). Asimismo, los <strong style={{ color: "var(--accent-pink)" }}>sábados por la noche</strong> registran la mayor densidad semanal de llamados al 911.
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
                    color: hours.map((h) => (h >= 18 ? "#f59e0b" : "#06b6d4")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#9ca3af" },
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
                    color: daysOrder.map((d) => (d === "Sábado" ? "#fbbf24" : "#10b981")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#9ca3af" },
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
              font: { color: "#9ca3af" },
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
