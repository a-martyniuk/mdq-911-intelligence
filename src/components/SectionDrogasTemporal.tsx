"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Clock, Calendar, AlertTriangle, Download, FileText, Flame, ShieldAlert, Sparkles, Crosshair, MapPin, Play, Pause, FastForward, RotateCcw, Layers } from "lucide-react";
import { generateDrogasTemporalPDF, generateDrogasTacticalDeploymentPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";
import { JCP_MUNICIPAL_BOUNDARY_GEOJSON } from "@/lib/jurisdictionsJcpGeoJSON";
import { RENABAP_JCP_GEOJSON } from "@/lib/renabapJcpGeoJSON";
import "leaflet/dist/leaflet.css";

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

function normalizeDay(d: string): string {
  if (!d) return "Sin Dato";
  const s = d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s.startsWith("lun")) return "Lunes";
  if (s.startsWith("mar")) return "Martes";
  if (s.startsWith("mie")) return "Miércoles";
  if (s.startsWith("jue")) return "Jueves";
  if (s.startsWith("vie")) return "Viernes";
  if (s.startsWith("sab")) return "Sábado";
  if (s.startsWith("dom")) return "Domingo";
  return d;
}

function getDay(inc: any): string {
  if (inc.dia_semana) return normalizeDay(inc.dia_semana);
  if (inc.dia) return normalizeDay(inc.dia);
  if (inc.Dia_Semana) return normalizeDay(inc.Dia_Semana);
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

export default function SectionDrogasTemporal({ incidents = [] }: SectionDrogasTemporalProps) {
  const [filterOrigen, setFilterOrigen] = useState<string>("todos");
  const [filterSustancia, setFilterSustancia] = useState<string>("todos");
  const [filterArmas, setFilterArmas] = useState<string>("todos");
  const [filterBarrio, setFilterBarrio] = useState<string>("todos");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [excludeCentro, setExcludeCentro] = useState<boolean>(true);

  // Filtered dataset
  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      const p = (inc.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("PUEYRREDON") || p.includes("PUEYRREDÓN") || p.includes("MDP")) return false;

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
        const sNorm = (inc.sustancia || inc.SubTipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fNorm = filterSustancia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (fNorm.includes("coca")) {
          if (!sNorm.includes("coca")) return false;
        } else if (fNorm.includes("paco")) {
          if (!sNorm.includes("paco") && !sNorm.includes("pasta base")) return false;
        } else if (fNorm.includes("mari")) {
          if (!sNorm.includes("mari") && !sNorm.includes("faso") && !sNorm.includes("flores")) return false;
        } else if (fNorm.includes("sintet")) {
          if (!sNorm.includes("sintet") && !sNorm.includes("pastilla") && !sNorm.includes("extasis")) return false;
        } else if (fNorm.includes("poli")) {
          if (!sNorm.includes("poli") && !sNorm.includes("no especificada")) return false;
        } else if (!sNorm.includes(fNorm)) {
          return false;
        }
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
      Madrugada: { total: 0, armed: 0, label: "Madrugada (00-06 hs)", color: "#64748b" },
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

  // Scrubber / Time-Slider State
  const [scrubHour, setScrubHour] = useState<number>(20); // Default to peak evening hour
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1 = 1300ms, 2 = 650ms
  const [cumulativeMode, setCumulativeMode] = useState<boolean>(false);
  const [filterTimeMode, setFilterTimeMode] = useState<"hour" | "all">("hour");

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
    if (filterTimeMode === "all") return filtered;
    if (cumulativeMode) {
      return filtered.filter((inc) => getHour(inc) <= scrubHour);
    }
    return filtered.filter((inc) => getHour(inc) === scrubHour);
  }, [filtered, scrubHour, cumulativeMode, filterTimeMode]);

  // Hourly metrics for scrubber display
  const scrubMetrics = useMemo(() => {
    const totalInHour = scrubbedIncidents.length;
    const totalAll = filtered.length || 1;
    const pct = ((totalInHour / totalAll) * 100).toFixed(1);
    const armed = scrubbedIncidents.filter(isArmed).length;
    const armedPct = totalInHour > 0 ? ((armed / totalInHour) * 100).toFixed(1) : "0.0";
    const cocaine = scrubbedIncidents.filter((i) => (i.sustancia || "").toUpperCase().includes("COCA")).length;
    const paco = scrubbedIncidents.filter((i) => (i.sustancia || "").toUpperCase().includes("PACO")).length;
    const mari = scrubbedIncidents.filter((i) => (i.sustancia || "").toUpperCase().includes("MARI")).length;
    const dominantSubstance =
      cocaine >= paco && cocaine >= mari && cocaine > 0
        ? `Cocaína (${cocaine})`
        : paco >= mari && paco > 0
        ? `Paco (${paco})`
        : mari > 0
        ? `Marihuana (${mari})`
        : "Sin especificar";
    const geocoded = scrubbedIncidents.filter((r) => r.lat && r.lng).length;
    return { totalInHour, pct, armed, armedPct, dominantSubstance, geocoded };
  }, [scrubbedIncidents, filtered]);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.520, -58.775],
          zoom: 13,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
        }).addTo(map);

        // Add JCP municipal boundary
        L.geoJSON(JCP_MUNICIPAL_BOUNDARY_GEOJSON as any, {
          style: {
            color: "#dc2626",
            weight: 2,
            dashArray: "4, 4",
            fillOpacity: 0.04,
          },
        }).addTo(map);

        // Add RENABAP settlements outline
        L.geoJSON(RENABAP_JCP_GEOJSON as any, {
          style: {
            color: "#ea580c",
            weight: 1.5,
            dashArray: "3, 3",
            fillOpacity: 0.12,
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

  // Sync Markers when scrub selection changes
  useEffect(() => {
    if (!mapReady || !markersLayerRef.current || !mapInstanceRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    import("leaflet").then((L) => {
      const points = scrubbedIncidents
        .filter((r) => r.lat && r.lng)
        .slice(0, 350); // Cap for 60fps interaction during scrub

      points.forEach((r) => {
        const hasArmas = isArmed(r);
        const sust = (r.sustancia || "").toUpperCase();
        const isBunker = r.tipoLugar && (r.tipoLugar.includes("Búnker") || r.tipoLugar.includes("Ventanita"));

        let color = "#3b82f6";
        if (hasArmas) {
          color = "#ef4444";
        } else if (sust.includes("PACO")) {
          color = "#ec4899";
        } else if (sust.includes("COCA")) {
          color = "#dc2626";
        } else if (sust.includes("MARI")) {
          color = "#10b981";
        }

        const marker = L.circleMarker([r.lat, r.lng], {
          radius: hasArmas ? 6 : isBunker ? 5.5 : 4,
          fillColor: color,
          color: "#ffffff",
          weight: 1,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 0.82rem; color: #0f172a; padding: 2px; max-width: 250px;">
            <strong style="color: ${color}; font-size: 0.88rem;">
              ${hasArmas ? "⚠️ HECHO CON ARMAS" : isBunker ? "🏚️ BÚNKER / VENTANITA" : "💊 NARCOMENUDEO"}
            </strong><br/>
            <b>Hora:</b> ${String(getHour(r)).padStart(2, "0")}:00 hs (${getSlot(getHour(r))})<br/>
            <b>Sustancia:</b> ${r.sustancia || "No especificada"}<br/>
            <b>Dirección:</b> ${r.direccion || "José C. Paz"}<br/>
            <b>Barrio:</b> ${r.barrio || "Sin dato"}<br/>
            ${r.relato ? `<div style="margin-top: 4px; font-size: 0.75rem; color: #475569; max-height: 80px; overflow-y: auto;"><i>${r.relato.slice(0, 140)}...</i></div>` : ""}
          </div>
        `);
        marker.addTo(layer);
      });
    });
  }, [scrubbedIncidents, mapReady]);

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", borderLeft: "4px solid #ef4444" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.5rem" }}>
              <Clock color="#dc2626" size={20} />
              <span>Patrones Temporales & Cronometría del Narcomenudeo (José C. Paz)</span>
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
                  partido: "José C. Paz",
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} /> Informe Cronológico (PDF)
            </button>

            <button
              onClick={() => {
                generateDrogasTacticalDeploymentPDF(
                  filtered,
                  "todos",
                  {
                    origen: filterOrigen,
                    sustancia: filterSustancia,
                    armas: filterArmas,
                    barrio: filterBarrio,
                    partido: "José C. Paz",
                  },
                  "José C. Paz"
                );
              }}
              className="btn-export"
              style={{
                padding: "7px 14px",
                background: "rgba(220, 38, 38, 0.12)",
                color: "#ef4444",
                border: "1px solid rgba(220, 38, 38, 0.35)",
              }}
            >
              <Crosshair size={14} /> Plan Táctico (PDF)
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
                exportToCSV("cronometria_drogas_jose_c_paz", csvData);
              }}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} /> Exportar Horarios (CSV)
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
              <option value="todos">Todas las Fuentes (1.770 despachos)</option>
              <option value="DROGAS_ILICITAS_FORMAL">🔴 Tipificación Formal (989 hechos)</option>
              <option value="INFORMACION_VECINAL_KEYWORDS">🟢 Búsqueda Semántica Relatos (781 hechos)</option>
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
              <option value="SINTETICAS">Sintéticas / Pastillas</option>
              <option value="POLIRUBRO">Polirubro / Sin especificar</option>
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

        <div className="card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Hora de Mayor Densidad</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#3b82f6", margin: "0.2rem 0" }}>{peakHourIdx.toString().padStart(2, "0")}:00 hs</div>
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
          La venta de sustancias en José C. Paz se traslada al espacio público principalmente en la franja <strong>18:00 a 02:00 horas</strong>. A diferencia de otros delitos contra la propiedad donde el móvil se dispersa de día, el narcomenudeo incrementa su <strong>peligrosidad con un {nightArmedPct}% de hechos armados en la noche</strong>, motivados por custodias territoriales («soldaditos») armados con pistolas 9mm y revólveres calibres .22 y .38 para proteger los búnkers durante el abastecimiento nocturno de clientes.
        </p>
      </div>

      {/* Reproductor Crono-Topográfico Interactivo */}
      <div style={{
        background: "#ffffff",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        padding: "1.25rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={18} color="#dc2626" />
              <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Reproductor Crono-Topográfico del Narcomenudeo (José C. Paz)
              </h4>
              <span style={{
                background: scrubHour >= 18 ? "rgba(220, 38, 38, 0.15)" : "rgba(13, 92, 168, 0.1)",
                color: scrubHour >= 18 ? "#dc2626" : "var(--accent-pba-blue)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "0.72rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)"
              }}>
                {getSlot(scrubHour)} ({scrubHour >= 18 ? "Pico Crítico" : "Franja Habitual"})
              </span>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Evolución territorial del narcomenudeo y venta de estupefacientes hora a hora sincronizada con límites municipales y RENABAP.
            </p>
          </div>

          {/* Live Metrics Ticker */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ background: "#f8fafc", padding: "6px 12px", borderRadius: "6px", border: "1px solid #e2e8f0", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Despachos en la Hora</span>
              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{scrubMetrics.totalInHour} <span style={{ fontSize: "0.75rem", color: "#64748b" }}>({scrubMetrics.pct}%)</span></strong>
            </div>
            <div style={{ background: "#fef2f2", padding: "6px 12px", borderRadius: "6px", border: "1px solid #fecaca", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#991b1b", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Tasa con Armas</span>
              <strong style={{ fontSize: "0.95rem", color: "#dc2626" }}>{scrubMetrics.armedPct}% <span style={{ fontSize: "0.75rem", color: "#991b1b" }}>({scrubMetrics.armed})</span></strong>
            </div>
            <div style={{ background: "#f0fdf4", padding: "6px 12px", borderRadius: "6px", border: "1px solid #bbf7d0", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#166534", display: "block", textTransform: "uppercase", fontWeight: 700 }}>Predominio</span>
              <strong style={{ fontSize: "0.88rem", color: "#15803d" }}>{scrubMetrics.dominantSubstance}</strong>
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
                setFilterTimeMode("hour");
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
                  setFilterTimeMode("hour");
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
                  setFilterTimeMode("hour");
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
                background: cumulativeMode ? "rgba(220, 38, 38, 0.12)" : "#ffffff",
                border: "1px solid " + (cumulativeMode ? "#dc2626" : "#cbd5e1"),
                color: cumulativeMode ? "#dc2626" : "#475569",
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
                    setFilterTimeMode("hour");
                    setIsPlaying(false);
                    setScrubHour(slot.h);
                  }}
                  style={{
                    background: scrubHour === slot.h && filterTimeMode === "hour" ? "#dc2626" : "#ffffff",
                    color: scrubHour === slot.h && filterTimeMode === "hour" ? "#ffffff" : "#475569",
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
                  setFilterTimeMode(filterTimeMode === "all" ? "hour" : "all");
                }}
                style={{
                  background: filterTimeMode === "all" ? "#0f172a" : "#ffffff",
                  color: filterTimeMode === "all" ? "#ffffff" : "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  padding: "5px 9px",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {filterTimeMode === "all" ? "Filtro Desactivado" : "Ver Todo"}
              </button>
            </div>
          </div>

          {/* Range Slider Track */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", minWidth: "65px" }}>
              {filterTimeMode === "all" ? "24 HS" : `${String(scrubHour).padStart(2, "0")}:00 hs`}
            </span>
            <input
              type="range"
              min={0}
              max={23}
              value={scrubHour}
              disabled={filterTimeMode === "all"}
              onChange={(e) => {
                setFilterTimeMode("hour");
                setIsPlaying(false);
                setScrubHour(parseInt(e.target.value, 10));
              }}
              style={{
                flex: 1,
                cursor: "pointer",
                height: "7px",
                accentColor: scrubHour >= 18 ? "#dc2626" : "var(--accent-pba-blue)",
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
              font: { color: "#475569", family: "Inter, sans-serif" },
              margin: { l: 40, r: 20, t: 20, b: 40 },
              xaxis: { title: "Hora del Día", gridcolor: "#e2e8f0" },
              yaxis: { title: "Llamados 911", gridcolor: "#e2e8f0" },
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
            <Calendar size={18} color="#0d5ca8" />
            <span>Frecuencia por Día de la Semana</span>
          </div>
          <Plot
            data={[
              {
                x: daysOrder,
                y: dailyData.totalByD,
                type: "bar",
                name: "Total Despachos",
                marker: { color: "#0d5ca8" },
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
              font: { color: "#475569", family: "Inter, sans-serif" },
              margin: { l: 40, r: 20, t: 20, b: 40 },
              xaxis: { title: "Día de la Semana", gridcolor: "#e2e8f0" },
              yaxis: { title: "Cantidad", gridcolor: "#e2e8f0" },
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
            <Flame size={18} color="#d97706" />
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
              font: { color: "#475569", family: "Inter, sans-serif" },
              margin: { l: 90, r: 20, t: 20, b: 40 },
              xaxis: { title: "Día", gridcolor: "#e2e8f0" },
              yaxis: { title: "Franja", gridcolor: "#e2e8f0" },
            } as any}
            useResizeHandler
            style={{ width: "100%", height: "320px" }}
          />
        </div>

        {/* Heatmap: Top Barrios x Slot */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.4rem" }}>
            <div className="card-title" style={{ fontSize: "1rem", margin: 0 }}>
              <MapPin size={18} color="#059669" />
              <span>Matriz 2D: Top 8 Barrios vs Franja Horaria</span>
            </div>
            <button
              onClick={() => setExcludeCentro(!excludeCentro)}
              title={excludeCentro ? "Click para incluir José C. Paz (Centro / General)" : "Click para excluir genérico Centro"}
              style={{
                background: excludeCentro ? "#ecfdf5" : "#f1f5f9",
                border: `1px solid ${excludeCentro ? "#a7f3d0" : "#cbd5e1"}`,
                color: excludeCentro ? "#047857" : "#475569",
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
              {excludeCentro ? "✓ Excluyendo genérico Centro" : "Incluir genérico Centro"}
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
              font: { color: "#475569", family: "Inter, sans-serif" },
              margin: { l: 120, r: 20, t: 20, b: 40 },
              xaxis: { title: "Franja Horaria", gridcolor: "#e2e8f0" },
              yaxis: { title: "Barrio", gridcolor: "#e2e8f0" },
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
                      <div style={{ fontSize: "0.72rem", color: "#0284c7" }}>{inc.barrio || "José C. Paz"}</div>
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
