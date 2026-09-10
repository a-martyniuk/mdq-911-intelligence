"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Clock, Calendar, AlertTriangle, Download, FileText, Flame, ShieldAlert, Sparkles, Crosshair, MapPin } from "lucide-react";
import { generateDrogasTemporalPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SectionDrogasTemporalProps {
  incidents: any[];
}

function getHour(inc: any): number {
  if (typeof inc.hora === "number" && !isNaN(inc.hora) && inc.hora >= 0 && inc.hora <= 23) {
    return inc.hora;
  }
  if (inc.hora) {
    const parts = String(inc.hora).split(":");
    const h = parseInt(parts[0], 10);
    if (!isNaN(h) && h >= 0 && h <= 23) return h;
  }
  if (inc.fecha && String(inc.fecha).includes("T")) {
    const d = new Date(inc.fecha);
    if (!isNaN(d.getTime())) return d.getHours();
  }
  return 12;
}

function getDay(inc: any): string {
  if (inc.dia_semana) return inc.dia_semana;
  if (inc.dia) return inc.dia;
  if (inc.fecha) {
    const parts = String(inc.fecha).split("/");
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      if (!isNaN(d.getTime())) {
        const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return days[d.getDay()];
      }
    }
    const d = new Date(inc.fecha);
    if (!isNaN(d.getTime())) {
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      return days[d.getDay()];
    }
  }
  return "Sin Dato";
}

function isArmed(inc: any): boolean {
  return Boolean(inc.tieneArmas || inc.armas === true || inc.armas === "SI");
}

function getSlot(h: number): "Madrugada" | "Mañana" | "Tarde" | "Noche" {
  if (h >= 0 && h < 6) return "Madrugada";
  if (h >= 6 && h < 12) return "Mañana";
  if (h >= 12 && h < 18) return "Tarde";
  return "Noche";
}

export default function SectionMalvinasTemporal({ incidents = [] }: SectionDrogasTemporalProps) {
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");
  const [filterBarrio, setFilterBarrio] = useState<string>("todos");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [excludeCentro, setExcludeCentro] = useState<boolean>(true);

  // Filtered dataset
  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (filterOrigen !== "todos") {
        const o = (inc.origen || inc.Origen_Dataset || "").toUpperCase();
        const f = filterOrigen.toUpperCase();
        if (f === "DROGAS_ILICITAS_FORMAL") {
          if (!o.includes("DROGAS_ILICITAS") && !o.includes("FORMAL")) return false;
        } else if (f === "INFORMACION_VECINAL_KEYWORDS") {
          if (!o.includes("KEYWORD") && !o.includes("INFORMACION") && !o.includes("RELATO")) return false;
        } else if (!o.includes(f)) {
          return false;
        }
      }
      if (filterSustancia !== "todos") {
        const s = (inc.sustancia || "").toUpperCase();
        if (!s.includes(filterSustancia.toUpperCase())) return false;
      }
      if (filterArmas !== "todos") {
        const want = filterArmas === "si";
        if (isArmed(inc) !== want) return false;
      }
      if (filterBarrio !== "todos") {
        const b = (inc.barrio || "").toUpperCase();
        if (!b.includes(filterBarrio.toUpperCase())) return false;
      }
      return true;
    });
  }, [incidents, filterOrigen, filterSustancia, filterArmas, filterBarrio]);

  // List of distinct barrios
  const barriosList = useMemo(() => {
    const s = new Set<string>();
    incidents.forEach((i) => {
      if (i.barrio && i.barrio.trim()) s.add(i.barrio.trim());
    });
    return Array.from(s).sort();
  }, [incidents]);

  // Hourly counts (0..23)
  const hourlyData = useMemo(() => {
    const totalByH = new Array(24).fill(0);
    const armedByH = new Array(24).fill(0);
    filtered.forEach((inc) => {
      const h = getHour(inc);
      totalByH[h] += 1;
      if (isArmed(inc)) armedByH[h] += 1;
    });
    return { totalByH, armedByH };
  }, [filtered]);

  // Days counts
  const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const dailyData = useMemo(() => {
    const totalByD = new Array(7).fill(0);
    const armedByD = new Array(7).fill(0);
    filtered.forEach((inc) => {
      const d = getDay(inc);
      const idx = daysOrder.indexOf(d);
      if (idx !== -1) {
        totalByD[idx] += 1;
        if (isArmed(inc)) armedByD[idx] += 1;
      }
    });
    return { totalByD, armedByD };
  }, [filtered]);

  // Slots counts
  const slotStats = useMemo(() => {
    const slots = {
      Madrugada: { total: 0, armed: 0, label: "Madrugada (00-06 hs)", color: "#8b5cf6" },
      Mañana: { total: 0, armed: 0, label: "Mañana (06-12 hs)", color: "#3b82f6" },
      Tarde: { total: 0, armed: 0, label: "Tarde (12-18 hs)", color: "#f59e0b" },
      Noche: { total: 0, armed: 0, label: "Noche (18-24 hs)", color: "#ef4444" },
    };
    filtered.forEach((inc) => {
      const h = getHour(inc);
      const slot = getSlot(h);
      slots[slot].total += 1;
      if (isArmed(inc)) slots[slot].armed += 1;
    });
    return slots;
  }, [filtered]);

  // 2D Heatmap: Day x Slot Matrix
  const heatmapDaySlot = useMemo(() => {
    const slots: Array<"Madrugada" | "Mañana" | "Tarde" | "Noche"> = ["Madrugada", "Mañana", "Tarde", "Noche"];
    const z = slots.map((slot) => {
      return daysOrder.map((day) => {
        return filtered.filter((inc) => getDay(inc) === day && getSlot(getHour(inc)) === slot).length;
      });
    });
    const text = z.map((row) => row.map((v) => (v > 0 ? String(v) : "-")));
    return { z, text, x: daysOrder, y: slots.map(s => s + " ") };
  }, [filtered]);

  // Top 8 Barrios x Slot Matrix
  const heatmapBarrioSlot = useMemo(() => {
    const candidateBarrios = barriosList.filter((b) => {
      if (excludeCentro) {
        const u = b.toUpperCase();
        if (u.includes("CENTRO") || u.includes("GENERAL") || u.includes("DESCONOCIDO")) return false;
      }
      return true;
    });

    const topBarrios = candidateBarrios
      .map((b) => ({
        barrio: b,
        count: filtered.filter((i) => (i.barrio || "").toUpperCase() === b.toUpperCase()).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((b) => b.barrio);

    const slots: Array<"Madrugada" | "Mañana" | "Tarde" | "Noche"> = ["Madrugada", "Mañana", "Tarde", "Noche"];
    const z = topBarrios.map((barrio) => {
      return slots.map((slot) => {
        return filtered.filter((inc) => (inc.barrio || "").toUpperCase() === barrio.toUpperCase() && getSlot(getHour(inc)) === slot).length;
      });
    });
    const text = z.map((row) => row.map((v) => (v > 0 ? String(v) : "-")));
    return { z, text, x: slots, y: topBarrios };
  }, [filtered, barriosList, excludeCentro]);

  // Key Aggregates
  const totalCount = filtered.length;
  const armedTotal = filtered.filter(isArmed).length;
  const armedPct = totalCount > 0 ? ((armedTotal / totalCount) * 100).toFixed(1) : "0.0";
  const nightCount = slotStats.Noche.total;
  const nightPct = totalCount > 0 ? ((nightCount / totalCount) * 100).toFixed(1) : "0.0";
  const nightArmedPct = nightCount > 0 ? ((slotStats.Noche.armed / nightCount) * 100).toFixed(1) : "0.0";

  // Peak Hour
  const peakHourIdx = hourlyData.totalByH.indexOf(Math.max(...hourlyData.totalByH));

  // Sample dispatches for inspector
  const dispatchesSample = useMemo(() => {
    return filtered
      .filter((i) => {
        if (selectedHour !== null) return getHour(i) === selectedHour;
        return true;
      })
      .filter((i) => i.relato && i.relato.trim().length > 5)
      .slice(0, 50);
  }, [filtered, selectedHour]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(139,92,246,0.05) 100%)", border: "1px solid rgba(239,68,68,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Clock color="#ef4444" size={24} />
              <span>Patrones Temporales & Cronometría del Narcomenudeo (Malvinas Argentinas)</span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.25rem 0 0" }}>
              Curvas horarias 24hs, letalidad armada cruzada por franja y matrices de calor de nocturnidad para planificación operativa.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateDrogasTemporalPDF(filtered, {
                  origen: filterOrigen,
                  sustancia: filterSustancia,
                  armas: filterArmas,
                  barrio: filterBarrio,
                });
              }}
              className="btn-logout"
              style={{
                height: "38px",
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
              <FileText size={15} /> 📄 Descargar Informe Cronológico (PDF)
            </button>

            <button
              onClick={() => {
                const csvData = filtered.map((i) => ({
                  ID_911: i.id,
                  Fecha: i.fecha,
                  Hora: i.hora,
                  Hora_Numerica: getHour(i),
                  Dia: getDay(i),
                  Franja: getSlot(getHour(i)),
                  Direccion: i.direccion,
                  Barrio: i.barrio,
                  Sustancia: i.sustancia,
                  Tiene_Armas: isArmed(i) ? "SI" : "NO",
                  Relato: i.relato,
                }));
                exportToCSV("cronometria_drogas_malvinas_argentinas", csvData);
              }}
              className="btn-logout"
              style={{
                height: "38px",
                padding: "0 0.9rem",
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
              <Download size={15} /> 📊 Exportar Distribución Horaria (CSV)
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{ marginTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", background: "var(--bg-base)", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
              📑 Fuente 911:
            </label>
            <select value={filterOrigen} onChange={(e) => setFilterOrigen(e.target.value)} className="form-input" style={{ width: "100%", height: "34px", fontSize: "0.8rem" }}>
              <option value="todos">Todas las Fuentes</option>
              <option value="DROGAS_ILICITAS_FORMAL">🔴 Tipificación Formal (989)</option>
              <option value="INFORMACION_VECINAL_KEYWORDS">🟢 Búsqueda Semántica (781)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
              💊 Sustancia:
            </label>
            <select value={filterSustancia} onChange={(e) => setFilterSustancia(e.target.value)} className="form-input" style={{ width: "100%", height: "34px", fontSize: "0.8rem" }}>
              <option value="todos">Todas las Sustancias</option>
              <option value="COCAÍNA">Cocaína</option>
              <option value="PACO">Paco / Pasta Base</option>
              <option value="MARIHUANA">Marihuana</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
              🔫 Conflictividad Armada:
            </label>
            <select value={filterArmas} onChange={(e) => setFilterArmas(e.target.value)} className="form-input" style={{ width: "100%", height: "34px", fontSize: "0.8rem" }}>
              <option value="todos">Todas las denuncias</option>
              <option value="si">Solo con Armas / Tiroteos</option>
              <option value="no">Sin armas declaradas</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.2rem" }}>
              🏘️ Barrio:
            </label>
            <select value={filterBarrio} onChange={(e) => setFilterBarrio(e.target.value)} className="form-input" style={{ width: "100%", height: "34px", fontSize: "0.8rem" }}>
              <option value="todos">Todos los Barrios ({barriosList.length})</option>
              {barriosList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Despachos Activos</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--text-primary)", margin: "0.2rem 0" }}>{totalCount.toLocaleString()}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Base filtrada de llamadas 911</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #dc2626" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Pico Nocturno (18-24 hs)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#dc2626", margin: "0.2rem 0" }}>{nightCount.toLocaleString()} ({nightPct}%)</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Máxima concentración horaria</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Letalidad Armada Nocturna</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#f59e0b", margin: "0.2rem 0" }}>{nightArmedPct}%</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{slotStats.Noche.armed.toLocaleString()} hechos armados nocturnos</div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Hora de Mayor Densidad</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#8b5cf6", margin: "0.2rem 0" }}>{peakHourIdx.toString().padStart(2, "0")}:00 hs</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{hourlyData.totalByH[peakHourIdx] || 0} llamados registrados</div>
        </div>
      </div>

      {/* Operational Strategic Box */}
      <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "1.1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <ShieldAlert color="#ef4444" size={20} />
          <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
            HALLAZGO DE INTELIGENCIA OPERACIONAL: VULNERABILIDAD & TIROTEOS EN BÚNKERS
          </strong>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
          La venta de sustancias en Malvinas Argentinas se traslada al espacio público principalmente en la franja <strong>18:00 a 02:00 horas</strong>. A diferencia de otros delitos contra la propiedad donde el móvil se dispersa de día, el narcomenudeo incrementa su <strong>peligrosidad con un {nightArmedPct}% de hechos armados en la noche</strong>, motivados por custodias territoriales («soldaditos») armados con pistolas 9mm y revólveres calibres .22 y .38 para proteger los búnkers durante el abastecimiento nocturno de clientes.
        </p>
      </div>

      {/* Main Charts: Hourly Curve & Day of Week */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "1.5rem" }}>
        {/* Hourly Curve */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <div className="card-title" style={{ fontSize: "1rem" }}>
              <Clock size={18} color="#ef4444" />
              <span>Curva Horaria Continua (0 a 23 hs): Total vs Incidentes Armados</span>
            </div>
            {selectedHour !== null && (
              <button
                onClick={() => setSelectedHour(null)}
                style={{ fontSize: "0.72rem", background: "none", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: "4px", cursor: "pointer", color: "var(--text-muted)" }}
              >
                Limpiar filtro hora ({selectedHour}:00 hs)
              </button>
            )}
          </div>
          <Plot
            data={[
              {
                x: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
                y: hourlyData.totalByH,
                type: "bar",
                name: "Total Despachos",
                marker: { color: "#3b82f6" },
              },
              {
                x: Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`),
                y: hourlyData.armedByH,
                type: "bar",
                name: "Con Armas / Disparos",
                marker: { color: "#ef4444" },
              },
            ]}
            layout={{
              barmode: "group",
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { l: 40, r: 20, t: 20, b: 40 },
              xaxis: { title: "Hora del Día", gridcolor: "#1f2937" },
              yaxis: { title: "Llamados 911", gridcolor: "#1f2937" },
              legend: { orientation: "h", y: 1.15 },
            } as any}
            useResizeHandler
            style={{ width: "100%", height: "320px" }}
            onClick={(data: any) => {
              if (data.points && data.points[0]) {
                const hourNum = parseInt(data.points[0].x.split(":")[0], 10);
                setSelectedHour(hourNum);
              }
            }}
          />
        </div>

        {/* Day of Week */}
        <div className="card">
          <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            <Calendar size={18} color="#8b5cf6" />
            <span>Frecuencia por Día de la Semana</span>
          </div>
          <Plot
            data={[
              {
                x: daysOrder,
                y: dailyData.totalByD,
                type: "bar",
                name: "Total Despachos",
                marker: { color: "#8b5cf6" },
              },
              {
                x: daysOrder,
                y: dailyData.armedByD,
                type: "scatter",
                mode: "lines+markers",
                name: "Armados",
                line: { color: "#ef4444", width: 3 },
                marker: { size: 8, color: "#ef4444" },
              },
            ]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { l: 40, r: 20, t: 20, b: 40 },
              xaxis: { title: "Día de la Semana", gridcolor: "#1f2937" },
              yaxis: { title: "Cantidad", gridcolor: "#1f2937" },
              legend: { orientation: "h", y: 1.15 },
            } as any}
            useResizeHandler
            style={{ width: "100%", height: "320px" }}
          />
        </div>
      </div>

      {/* 2D Heatmaps: Day x Slot & Barrio x Slot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "1.5rem" }}>
        {/* Heatmap: Day x Slot */}
        <div className="card">
          <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            <Flame size={18} color="#f59e0b" />
            <span>Matriz 2D: Día de la Semana vs Franja Horaria</span>
          </div>
          <Plot
            data={[
              {
                z: heatmapDaySlot.z,
                x: heatmapDaySlot.x,
                y: heatmapDaySlot.y,
                text: (heatmapDaySlot as any).text,
                texttemplate: "<b>%{text}</b>",
                textfont: { color: "#ffffff", size: 11 },
                type: "heatmap",
                colorscale: "YlOrRd",
                hoverongaps: false,
              },
            ]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { l: 90, r: 20, t: 20, b: 40 },
              xaxis: { title: "Día", gridcolor: "#1f2937" },
              yaxis: { title: "Franja", gridcolor: "#1f2937" },
            } as any}
            useResizeHandler
            style={{ width: "100%", height: "320px" }}
          />
        </div>

        {/* Heatmap: Top Barrios x Slot */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.4rem" }}>
            <div className="card-title" style={{ fontSize: "1rem", margin: 0 }}>
              <MapPin size={18} color="#10b981" />
              <span>Matriz 2D: Top 8 Barrios vs Franja Horaria</span>
            </div>
            <button
              onClick={() => setExcludeCentro(!excludeCentro)}
              title={excludeCentro ? "Click para incluir registros genéricos sin barrio específico" : "Click para excluir registros genéricos"}
              style={{
                background: excludeCentro ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.06)",
                border: `1px solid ${excludeCentro ? "#10b981" : "#4b5563"}`,
                color: excludeCentro ? "#34d399" : "#9ca3af",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "0.72rem",
                cursor: "pointer",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              {excludeCentro ? "✓ Excluyendo genérico partido" : "Incluir genérico partido"}
            </button>
          </div>
          <Plot
            data={[
              {
                z: heatmapBarrioSlot.z,
                x: heatmapBarrioSlot.x,
                y: heatmapBarrioSlot.y,
                text: (heatmapBarrioSlot as any).text,
                texttemplate: "<b>%{text}</b>",
                textfont: { color: "#ffffff", size: 11 },
                type: "heatmap",
                colorscale: "Reds",
                hoverongaps: false,
              },
            ]}
            layout={{
              paper_bgcolor: "transparent",
              plot_bgcolor: "transparent",
              font: { color: "#9ca3af" },
              margin: { l: 120, r: 20, t: 20, b: 40 },
              xaxis: { title: "Franja Horaria", gridcolor: "#1f2937" },
              yaxis: { title: "Barrio", gridcolor: "#1f2937" },
            } as any}
            useResizeHandler
            style={{ width: "100%", height: "320px" }}
          />
        </div>
      </div>

      {/* Narrative & Dispatch Inspector */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div>
            <div className="card-title" style={{ fontSize: "1.05rem" }}>
              <FileText size={18} color="var(--accent-indigo)" />
              <span>
                Auditoría Forense de Despachos 911 en Ventana Crítica ({dispatchesSample.length} llamados analizados
                {selectedHour !== null ? ` a las ${selectedHour}:00 hs` : ""})
              </span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.15rem 0 0" }}>
              Inspección de relatos completos sin truncar para la verificación de modus operandi, armamento y transas.
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-base)", borderBottom: "2px solid var(--border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "0.65rem 0.85rem" }}>ID / Fecha-Hora</th>
                <th style={{ padding: "0.65rem 0.85rem" }}>Ubicación / Barrio</th>
                <th style={{ padding: "0.65rem 0.85rem" }}>Sustancia / Armas</th>
                <th style={{ padding: "0.65rem 0.85rem" }}>Relato Íntegro 911 (Sin Truncar)</th>
              </tr>
            </thead>
            <tbody>
              {dispatchesSample.map((inc) => {
                const armed = isArmed(inc);
                return (
                  <tr key={inc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.65rem 0.85rem", whiteSpace: "nowrap" }}>
                      <strong>#{inc.id}</strong>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        {inc.fecha || ""} {inc.hora || ""} ({getSlot(getHour(inc))})
                      </div>
                    </td>
                    <td style={{ padding: "0.65rem 0.85rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inc.direccion || "Sin dirección"}</div>
                      <div style={{ fontSize: "0.72rem", color: "#0284c7" }}>{inc.barrio || "Malvinas Argentinas"}</div>
                    </td>
                    <td style={{ padding: "0.65rem 0.85rem", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{inc.sustancia || "No esp."}</div>
                      {armed ? (
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, background: "rgba(239,68,68,0.2)", color: "#ef4444", padding: "1px 6px", borderRadius: "4px" }}>
                          🚨 CON ARMAS
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sin armas</span>
                      )}
                    </td>
                    <td style={{ padding: "0.65rem 0.85rem" }}>
                      <div
                        style={{
                          background: "var(--bg-base)",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.4,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          borderLeft: armed ? "3px solid #ef4444" : "3px solid #64748b",
                        }}
                      >
                        {inc.relato}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


