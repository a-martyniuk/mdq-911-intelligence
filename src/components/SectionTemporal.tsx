"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { Clock, Calendar, AlertTriangle, Download, FileText, Play, Pause, FastForward, RotateCcw, Flame, MapPin, ShieldAlert, Layers } from "lucide-react";
import { generateTemporalReportPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";
import { POLICE_JURISDICTIONS_GEOJSON } from "@/lib/jurisdictionsGeoJSON";
import "leaflet/dist/leaflet.css";

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

function getSlot(h: number): string {
  if (h >= 0 && h < 6) return "Madrugada (00-06 hs)";
  if (h >= 6 && h < 12) return "Mañana (06-12 hs)";
  if (h >= 12 && h < 18) return "Tarde (12-18 hs)";
  return "Noche (18-24 hs)";
}

export default function SectionTemporal({ incidents = [] }: SectionTemporalProps) {
  const safeIncidents = incidents || [];

  // Scrubber / Time-Slider State
  const [scrubHour, setScrubHour] = useState<number>(20); // Default to peak evening hour
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1 = 1200ms, 2 = 600ms
  const [cumulativeMode, setCumulativeMode] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<"hour" | "all">("hour");

  // Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Playback loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = playSpeed === 2 ? 650 : 1300;
    const timer = setInterval(() => {
      setScrubHour((prev) => (prev + 1) % 24);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playSpeed]);

  // Incidents for current scrub selection
  const scrubbedIncidents = useMemo(() => {
    if (filterMode === "all") return safeIncidents;
    if (cumulativeMode) {
      return safeIncidents.filter((r) => {
        const h = r.Hora ?? r.hora;
        return typeof h === "number" && h <= scrubHour;
      });
    }
    return safeIncidents.filter((r) => {
      const h = r.Hora ?? r.hora;
      return (h === scrubHour);
    });
  }, [safeIncidents, scrubHour, cumulativeMode, filterMode]);

  // Hourly metrics for scrubber display
  const scrubMetrics = useMemo(() => {
    const totalInHour = scrubbedIncidents.length;
    const totalAll = safeIncidents.length || 1;
    const pct = ((totalInHour / totalAll) * 100).toFixed(1);
    const armed = scrubbedIncidents.filter((r) => r.Tiene_Armas === true || r.tieneArmas === true || (r.Tipo || "").includes("ARMA") || (r.Tipo || "").includes("DISPARO")).length;
    const armedPct = totalInHour > 0 ? ((armed / totalInHour) * 100).toFixed(1) : "0.0";
    const geocoded = scrubbedIncidents.filter((r) => (r.Latitud_Clean || r.lat) && (r.Longitud_Clean || r.lng)).length;
    return { totalInHour, pct, armed, armedPct, geocoded };
  }, [scrubbedIncidents, safeIncidents]);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-38.005, -57.56],
          zoom: 12,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        // Add Jurisdictions outline
        L.geoJSON(POLICE_JURISDICTIONS_GEOJSON as any, {
          style: {
            color: "#6366f1",
            weight: 1.5,
            fillOpacity: 0.05,
          },
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;

        mapInstanceRef.current = map;
        setMapReady(true);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Sync Markers when scrubHour changes
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || !mapInstanceRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    import("leaflet").then((L) => {
      const points = scrubbedIncidents
        .filter((r) => (r.Latitud_Clean || r.lat) && (r.Longitud_Clean || r.lng))
        .slice(0, 350); // Cap for 60fps interaction during scrub

      points.forEach((r) => {
        const lat = r.Latitud_Clean || r.lat;
        const lng = r.Longitud_Clean || r.lng;
        const isArmed = r.Tiene_Armas === true || r.tieneArmas === true || (r.Tipo || "").includes("ARMA") || (r.Tipo || "").includes("DISPARO");
        const isRecovery = (r.Tipo || "").includes("HALLAZGO");

        const color = isArmed ? "#ef4444" : isRecovery ? "#10b981" : "#0d5ca8";

        const marker = L.circleMarker([lat, lng], {
          radius: isArmed ? 6 : 4.5,
          fillColor: color,
          color: "#ffffff",
          weight: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 0.82rem; color: #0f172a; padding: 2px;">
            <strong style="color: ${color}; font-size: 0.88rem;">
              ${isArmed ? "⚠️ HECHO ARMADO" : isRecovery ? "🟢 HALLAZGO" : "🔵 SUSTRAÍDO / 911"}
            </strong><br/>
            <b>Hora:</b> ${String(r.Hora ?? r.hora ?? "").padStart(2, "0")}:00 hs<br/>
            <b>Tipo:</b> ${r.Tipo || r.tipo || "Incidente"}<br/>
            <b>Dirección:</b> ${r.Dirección || r.direccion || "General Pueyrredón"}<br/>
            ${r.Relato ? `<div style="margin-top: 4px; font-size: 0.75rem; color: #475569; max-height: 80px; overflow-y: auto;"><i>${r.Relato.slice(0, 140)}...</i></div>` : ""}
          </div>
        `);
        marker.addTo(layer);
      });
    });
  }, [scrubbedIncidents, mapReady]);

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
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderLeft: "3px solid #d97706",
          borderRadius: "var(--radius-sm)",
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem"
        }}>
          <AlertTriangle size={20} color="#d97706" />
          <div>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
              Hallazgo Crítico: Picos de Nocturnidad y Fin de Semana
            </strong>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
              La franja de <strong style={{ color: "var(--accent-pba-blue)" }}>18:00 a 24:00 hs concentra el {nightPct.toFixed(1)}% de los incidentes</strong> ({nightCases.toLocaleString()} casos). Asimismo, los <strong style={{ color: "#d97706" }}>sábados por la noche</strong> registran la mayor densidad semanal de llamados al 911.
            </p>
          </div>
        </div>

        {/* Reproductor Crono-Topográfico Interactivo */}
        <div style={{
          background: "#ffffff",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          padding: "1.25rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={18} color="var(--accent-pba-blue)" />
                <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Reproductor Crono-Topográfico & Dispersión Espacio-Temporal
                </h4>
                <span style={{
                  background: scrubHour >= 18 ? "rgba(217, 119, 6, 0.15)" : "rgba(13, 92, 168, 0.1)",
                  color: scrubHour >= 18 ? "#d97706" : "var(--accent-pba-blue)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)"
                }}>
                  {getSlot(scrubHour)}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Observe la evolución geográfica de los hechos 911 hora por hora (efecto "mancha de aceite").
              </p>
            </div>

            {/* Live Metrics Ticker */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Hechos en la Hora</span>
                <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{scrubMetrics.totalInHour} <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({scrubMetrics.pct}%)</span></strong>
              </div>
              <div style={{ background: "#fef2f2", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fecaca", textAlign: "center" }}>
                <span style={{ fontSize: "0.7rem", color: "#991b1b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Tasa de Armas</span>
                <strong style={{ fontSize: "0.95rem", color: "#dc2626" }}>{scrubMetrics.armedPct}% <span style={{ fontSize: "0.75rem", color: "#991b1b" }}>({scrubMetrics.armed})</span></strong>
              </div>
            </div>
          </div>

          {/* Interactive Player Controls */}
          <div style={{
            background: "#f1f5f9",
            padding: "0.85rem 1rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid #e2e8f0",
            marginBottom: "1rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {/* Play / Pause */}
              <button
                type="button"
                onClick={() => {
                  setFilterMode("hour");
                  setIsPlaying(!isPlaying);
                }}
                className="btn-primary"
                style={{ padding: "6px 14px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", background: isPlaying ? "#dc2626" : "var(--accent-pba-blue)" }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                <span>{isPlaying ? "Pausar" : "Reproducir 24h"}</span>
              </button>

              {/* Speed toggle */}
              <button
                type="button"
                onClick={() => setPlaySpeed(playSpeed === 1 ? 2 : 1)}
                style={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "6px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#334155",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Cambiar velocidad de reproducción"
              >
                <FastForward size={13} />
                <span>{playSpeed}x</span>
              </button>

              {/* Step Buttons */}
              <div style={{ display: "flex", border: "1px solid #cbd5e1", borderRadius: "4px", overflow: "hidden", background: "#fff" }}>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("hour");
                    setScrubHour((prev) => (prev === 0 ? 23 : prev - 1));
                  }}
                  style={{ border: "none", background: "transparent", padding: "5px 10px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, borderRight: "1px solid #e2e8f0" }}
                  title="Hora anterior"
                >
                  -1h
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode("hour");
                    setScrubHour((prev) => (prev === 23 ? 0 : prev + 1));
                  }}
                  style={{ border: "none", background: "transparent", padding: "5px 10px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                  title="Hora siguiente"
                >
                  +1h
                </button>
              </div>

              {/* Mode Toggle: Specific Hour vs Cumulative */}
              <button
                type="button"
                onClick={() => setCumulativeMode(!cumulativeMode)}
                style={{
                  background: cumulativeMode ? "rgba(13, 92, 168, 0.12)" : "#ffffff",
                  border: "1px solid " + (cumulativeMode ? "var(--accent-pba-blue)" : "#cbd5e1"),
                  color: cumulativeMode ? "var(--accent-pba-blue)" : "#475569",
                  borderRadius: "4px",
                  padding: "6px 10px",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px"
                }}
              >
                <Layers size={13} />
                <span>{cumulativeMode ? "Modo Acumulado (00h a hora)" : "Modo Hora Exacta"}</span>
              </button>

              {/* Quick Circadian Slots */}
              <div style={{ display: "flex", gap: "4px", marginLeft: "auto", flexWrap: "wrap" }}>
                {[
                  { label: "Madrugada", h: 3 },
                  { label: "Mañana", h: 9 },
                  { label: "Tarde", h: 15 },
                  { label: "Noche (Pico)", h: 21 },
                ].map((slot) => (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => {
                      setFilterMode("hour");
                      setIsPlaying(false);
                      setScrubHour(slot.h);
                    }}
                    style={{
                      background: scrubHour === slot.h && filterMode === "hour" ? "var(--accent-pba-blue)" : "#ffffff",
                      color: scrubHour === slot.h && filterMode === "hour" ? "#ffffff" : "#475569",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      padding: "5px 9px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {slot.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setFilterMode(filterMode === "all" ? "hour" : "all");
                  }}
                  style={{
                    background: filterMode === "all" ? "#0f172a" : "#ffffff",
                    color: filterMode === "all" ? "#ffffff" : "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "4px",
                    padding: "5px 9px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {filterMode === "all" ? "Filtro Desactivado" : "Ver Todo"}
                </button>
              </div>
            </div>

            {/* Range Slider Track */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", minWidth: "65px" }}>
                {filterMode === "all" ? "24 HS" : `${String(scrubHour).padStart(2, "0")}:00 hs`}
              </span>
              <input
                type="range"
                min={0}
                max={23}
                value={scrubHour}
                disabled={filterMode === "all"}
                onChange={(e) => {
                  setFilterMode("hour");
                  setIsPlaying(false);
                  setScrubHour(parseInt(e.target.value, 10));
                }}
                style={{
                  flex: 1,
                  cursor: "pointer",
                  height: "7px",
                  accentColor: scrubHour >= 18 ? "#d97706" : "var(--accent-pba-blue)",
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                00:00 ➔ 23:59
              </span>
            </div>
          </div>

          {/* Spatio-temporal Map View */}
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "360px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #cbd5e1",
              background: "#e2e8f0"
            }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {/* Chart 1: Hourly Distribution */}
          <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Incidentes por Hora del Día (00-23 hs)</h4>
            <Plot
              data={[
                {
                  x: hours.map((h) => `${h}:00`),
                  y: hourlyCounts,
                  type: "bar",
                  marker: {
                    color: hours.map((h) => (h >= 18 ? "#d97706" : "#0d5ca8")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#475569", family: "Inter, sans-serif" },
                margin: { l: 40, r: 20, t: 20, b: 40 },
                xaxis: { gridcolor: "#e2e8f0" },
                yaxis: { gridcolor: "#e2e8f0" },
              } as any}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>

          {/* Chart 2: Day of Week */}
          <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Incidentes por Día de la Semana</h4>
            <Plot
              data={[
                {
                  x: daysOrder,
                  y: dailyCounts,
                  type: "bar",
                  marker: {
                    color: daysOrder.map((d) => (d === "Sábado" ? "#d97706" : "#0d5ca8")),
                  },
                } as any,
              ]}
              layout={{
                autosize: true,
                height: 320,
                paper_bgcolor: "transparent",
                plot_bgcolor: "transparent",
                font: { color: "#475569", family: "Inter, sans-serif" },
                margin: { l: 40, r: 20, t: 20, b: 40 },
                xaxis: { gridcolor: "#e2e8f0" },
                yaxis: { gridcolor: "#e2e8f0" },
              } as any}
              useResizeHandler
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {/* Chart 3: 2D Crosstab Heatmap */}
        <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
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
              font: { color: "#475569", family: "Inter, sans-serif" },
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
