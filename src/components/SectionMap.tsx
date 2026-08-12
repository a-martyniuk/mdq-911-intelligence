"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Play, Pause, RotateCcw, Clock, Navigation, Filter, Layers, ShieldAlert, Home, Eye, CheckSquare, Square, Zap } from "lucide-react";
import { POLICE_JURISDICTIONS_GEOJSON } from "@/lib/jurisdictionsGeoJSON";
import { RENABAP_BARRIOS_GEOJSON } from "@/lib/renabapGeoJSON";
import "leaflet/dist/leaflet.css";

interface GeoPoint {
  id: number;
  lat: number;
  lng: number;
  tipo: string;
  subtipo: string;
  direccion: string;
  fecha: string;
  origen: string;
  franja: string;
  dia: string;
  hora: number;
  marca?: string;
  patente?: string;
  relato?: string;
  latHallazgo?: number;
  lngHallazgo?: number;
}

interface SectionMapProps {
  geoPoints: GeoPoint[];
}

function MapComponent({
  points,
  showVectors,
  showJurisdictions,
  showRenabap,
  showPoints,
}: {
  points: GeoPoint[];
  showVectors: boolean;
  showJurisdictions: boolean;
  showRenabap: boolean;
  showPoints: boolean;
}) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const map = L.map("leaflet-map", {
      center: [-38.00, -57.56],
      zoom: 12,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Render Official MGP Police Jurisdiction Polygons layer
    if (showJurisdictions) {
      L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
        style: (feature: any) => ({
          color: feature.properties.color || "#6366f1",
          weight: 2,
          opacity: 0.85,
          fillColor: feature.properties.color || "#6366f1",
          fillOpacity: 0.12,
        }),
        onEachFeature: (feature: any, layer: any) => {
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
              <strong style="color: ${feature.properties.color || '#6366f1'}; font-size: 0.95rem;">
                👮 ${feature.properties.name}
              </strong><br/>
              <span style="font-size: 0.8rem; color: #444;">
                <b>Zonas Incluidas:</b> ${feature.properties.description || feature.properties.barrios}
              </span><br/>
              <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #ccc; font-size: 0.775rem; color: #666;">
                👮 <i>Cuadrante Policial Oficial MGP (Subrubro 122)</i>
              </div>
            </div>
          `);
        },
      }).addTo(map);
    }

    // Render RENABAP & Barrios Populares layer
    if (showRenabap) {
      L.geoJSON(RENABAP_BARRIOS_GEOJSON, {
        style: (feature: any) => ({
          color: feature.properties.isRenabap ? "#f97316" : "#38bdf8",
          weight: feature.properties.isRenabap ? 2.5 : 1.2,
          dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
          opacity: 0.9,
          fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
          fillOpacity: feature.properties.isRenabap ? 0.35 : 0.08,
        }),
        onEachFeature: (feature: any, layer: any) => {
          const isR = feature.properties.isRenabap;
          const fams = feature.properties.familias;
          const idRen = feature.properties.idRenabap;
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
              <strong style="color: ${isR ? '#ea580c' : '#0284c7'}; font-size: 0.95rem;">
                ${isR ? '🏡 RENABAP: ' : '📍 '}${feature.properties.name}
              </strong><br/>
              <span style="font-size: 0.8rem; color: #444;">
                ${isR ? `<b>Categoría:</b> Registro Nacional de Barrios Populares 2023 (SISU)` : '<b>Categoría:</b> Barrio Oficial MGP'}
              </span><br/>
              ${idRen ? `<span style="font-size: 0.775rem; color: #64748b;"><b>ID RENABAP:</b> #${idRen}</span><br/>` : ''}
              ${fams ? `<span style="font-size: 0.775rem; color: #64748b;"><b>Familias Registradas:</b> ${fams}</span><br/>` : ''}
              <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #ccc; font-size: 0.775rem; color: #ea580c; font-weight: 700;">
                SHP Oficial RENABAP 2023 Mar del Plata
              </div>
            </div>
          `);
        },
      }).addTo(map);
    }

    // Stratified sampling so ALL origins (Robo, Hallazgo, Disparos, Armas) are represented on map
    const samplePoints = (() => {
      if (!points || points.length === 0) return [];
      if (points.length <= 1500) return points;

      const byOrigen: Record<string, GeoPoint[]> = {};
      points.forEach((pt) => {
        const o = pt.origen || "Otros";
        if (!byOrigen[o]) byOrigen[o] = [];
        byOrigen[o].push(pt);
      });

      const result: GeoPoint[] = [];
      const keys = Object.keys(byOrigen);
      const perKeyLimit = Math.floor(1500 / keys.length);

      keys.forEach((k) => {
        const arr = byOrigen[k];
        if (arr.length <= perKeyLimit) {
          result.push(...arr);
        } else {
          const step = arr.length / perKeyLimit;
          for (let i = 0; i < perKeyLimit; i++) {
            result.push(arr[Math.floor(i * step)]);
          }
        }
      });
      return result;
    })();

    // Render 911 Incident Markers & Vector Trajectories
    if (showPoints) {
      samplePoints.forEach((pt) => {
        const isHallazgos = pt.origen === "Hallazgos";
        const isDisparos = pt.origen === "Disparos";
        const isArmas = pt.origen === "Armas";

        const color = isHallazgos ? "#10b981" : isDisparos ? "#f59e0b" : isArmas ? "#ef4444" : "#ec4899";

        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: isHallazgos ? 6.5 : 5,
          fillColor: color,
          color: "#ffffff",
          weight: 1.2,
          opacity: 0.9,
          fillOpacity: 0.8,
        });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 0.825rem; color: #1e293b; padding: 0.2rem; max-width: 260px;">
            <strong style="color: ${color}; font-size: 0.9rem;">${pt.tipo} (${pt.subtipo || "General"})</strong><br/>
            <span><b>ID:</b> #${pt.id} | <b>Origen:</b> ${pt.origen}</span><br/>
            <span><b>Fecha/Hora:</b> ${pt.fecha} - ${pt.hora}:00 hs</span><br/>
            <span><b>Dirección:</b> ${pt.direccion}</span><br/>
            ${pt.marca ? `<span><b>Marca:</b> ${pt.marca}</span><br/>` : ""}
            ${pt.patente ? `<span><b>Patente:</b> ${pt.patente}</span><br/>` : ""}
            ${pt.relato ? `<div style="margin-top:0.3rem; font-style:italic; font-size:0.75rem; background:#f1f5f9; padding:0.4rem; border-radius:4px;">"${pt.relato.slice(0, 110)}..."</div>` : ""}
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(map);

        // Vector line from Theft -> Recovery
        if (showVectors && pt.latHallazgo && pt.lngHallazgo) {
          const polyline = L.polyline(
            [
              [pt.lat, pt.lng],
              [pt.latHallazgo, pt.lngHallazgo],
            ],
            {
              color: "#3b82f6",
              weight: 2.5,
              opacity: 0.85,
              dashArray: "6, 6",
            }
          );

          polyline.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.8rem; color: #1e293b;">
              <strong style="color: #3b82f6;">Vector Robo ➔ Hallazgo (Patente ${pt.patente || "Emparejada"})</strong><br/>
              <b>Origen Sustracción:</b> ${pt.direccion}<br/>
              <b>Destino Descarte:</b> Lat ${pt.latHallazgo.toFixed(4)}, Lng ${pt.lngHallazgo.toFixed(4)}
            </div>
          `);

          polyline.addTo(map);

          L.circleMarker([pt.latHallazgo, pt.lngHallazgo], {
            radius: 7,
            fillColor: "#10b981",
            color: "#ffffff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).bindPopup(`<b>Punto de Hallazgo / Descarte:</b> Patente ${pt.patente || "Identificada"}`).addTo(map);
        }
      });
    }

    return () => {
      map.remove();
    };
  }, [L, points, showVectors, showJurisdictions, showRenabap, showPoints]);

  return (
    <div
      id="leaflet-map"
      style={{
        width: "100%",
        height: "600px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-md)",
        zIndex: 1,
      }}
    />
  );
}

export default function SectionMap({ geoPoints = [] }: SectionMapProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Layer switches states
  const [showPoints, setShowPoints] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [showJurisdictions, setShowJurisdictions] = useState(true);
  const [showRenabap, setShowRenabap] = useState(true);

  // Auto-play time slider
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour((prev) => {
          if (prev === null) return 0;
          if (prev >= 23) return 0;
          return prev + 1;
        });
      }, 1200);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Filter geoPoints by hour slider
  const filteredPoints = useMemo(() => {
    if (selectedHour === null) return geoPoints;
    return geoPoints.filter((pt) => pt.hora === selectedHour);
  }, [geoPoints, selectedHour]);

  // Quick Layer Presets
  const applyPreset = (preset: "all" | "renabap" | "jurisdictions" | "points_only") => {
    if (preset === "all") {
      setShowPoints(true);
      setShowVectors(true);
      setShowJurisdictions(true);
      setShowRenabap(true);
    } else if (preset === "renabap") {
      setShowPoints(true);
      setShowVectors(true);
      setShowJurisdictions(false);
      setShowRenabap(true);
    } else if (preset === "jurisdictions") {
      setShowPoints(true);
      setShowVectors(false);
      setShowJurisdictions(true);
      setShowRenabap(false);
    } else if (preset === "points_only") {
      setShowPoints(true);
      setShowVectors(false);
      setShowJurisdictions(false);
      setShowRenabap(false);
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">📍 Mapeo Geográfico & Geointeligencia Avanzada 911</div>
        <p className="card-subtitle">
          Exploración espacial de {geoPoints.length.toLocaleString()} incidentes georreferenciados con time-slider animado de 24 horas y vectores de flujo (Robo $\rightarrow$ Hallazgo).
        </p>

        {/* UNIFIED MAP LAYER SELECTOR PANEL */}
        <div style={{ background: "linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)", padding: "1.1rem", borderRadius: "10px", border: "1px solid var(--accent-indigo)", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Header & Quick Presets Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
              <Layers size={20} color="var(--accent-indigo)" />
              <span>Selector Global de Capas del Mapa</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Modos Rápidos:</span>
              <button
                onClick={() => applyPreset("all")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--accent-indigo)", background: "rgba(99,102,241,0.2)", color: "#a5b4fc", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Zap size={12} /> Activar Todas las Capas
              </button>
              <button
                onClick={() => applyPreset("renabap")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid #ea580c", background: "rgba(234,88,12,0.2)", color: "#fdba74", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Home size={12} /> Modo Enfriamiento RENABAP
              </button>
              <button
                onClick={() => applyPreset("jurisdictions")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid #8b5cf6", background: "rgba(139,92,246,0.2)", color: "#c4b5fd", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Layers size={12} /> Modo Comisarías
              </button>
              <button
                onClick={() => applyPreset("points_only")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Eye size={12} /> Solo Puntos 911
              </button>
            </div>
          </div>

          {/* Individual Interactive Checkbox Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {/* Layer 1: 911 Incidents Points */}
            <label onClick={() => setShowPoints(!showPoints)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showPoints ? "rgba(16,185,129,0.15)" : "var(--bg-base)", border: `1px solid ${showPoints ? "#10b981" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showPoints ? <CheckSquare size={16} color="#10b981" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showPoints ? "#fff" : "var(--text-secondary)" }}>
                  📍 Puntos & Incidentes 911
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {filteredPoints.length.toLocaleString()} eventos georreferenciados
                </div>
              </div>
            </label>

            {/* Layer 2: Trajectory Vectors */}
            <label onClick={() => setShowVectors(!showVectors)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showVectors ? "rgba(59,130,246,0.15)" : "var(--bg-base)", border: `1px solid ${showVectors ? "#3b82f6" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showVectors ? <CheckSquare size={16} color="#3b82f6" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showVectors ? "#fff" : "var(--text-secondary)" }}>
                  ➡️ Vectores Robo ➔ Hallazgo
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Flujos de abandono de vehículos
                </div>
              </div>
            </label>

            {/* Layer 3: Police Jurisdictions */}
            <label onClick={() => setShowJurisdictions(!showJurisdictions)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showJurisdictions ? "rgba(99,102,241,0.15)" : "var(--bg-base)", border: `1px solid ${showJurisdictions ? "var(--accent-indigo)" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showJurisdictions ? <CheckSquare size={16} color="var(--accent-indigo)" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showJurisdictions ? "#fff" : "var(--text-secondary)" }}>
                  👮 Comisarías 1ra a 16ta
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Polígonos oficiales MGP Subrubro 122
                </div>
              </div>
            </label>

            {/* Layer 4: RENABAP Barrios Populares */}
            <label onClick={() => setShowRenabap(!showRenabap)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showRenabap ? "rgba(234,88,12,0.15)" : "var(--bg-base)", border: `1px solid ${showRenabap ? "#ea580c" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showRenabap ? <CheckSquare size={16} color="#ea580c" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showRenabap ? "#fff" : "var(--text-secondary)" }}>
                  🏡 Asentamientos RENABAP
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  58 polígonos SHP 2023 (SISU)
                </div>
              </div>
            </label>
          </div>

          {/* Time Slider Controls Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "280px" }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  border: "none",
                  background: isPlaying ? "var(--accent-amber)" : "var(--accent-indigo)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.775rem",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                {isPlaying ? "Pausar 24h" : "Animar 24h"}
              </button>

              <button
                onClick={() => { setSelectedHour(null); setIsPlaying(false); }}
                style={{ padding: "0.35rem 0.65rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
              >
                <RotateCcw size={12} /> Reset
              </button>

              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-indigo)", minWidth: "110px" }}>
                <Clock size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.3rem" }} />
                {selectedHour === null ? "24 hs completas" : `${selectedHour.toString().padStart(2, "0")}:00 hs`}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={23}
              value={selectedHour === null ? 0 : selectedHour}
              onChange={(e) => {
                setIsPlaying(false);
                setSelectedHour(parseInt(e.target.value, 10));
              }}
              style={{ flex: 1, minWidth: "160px", accentColor: "var(--accent-indigo)" }}
            />
          </div>

        </div>

        {/* Dynamic Leaflet Map */}
        <MapComponent
          points={filteredPoints}
          showVectors={showVectors}
          showJurisdictions={showJurisdictions}
          showRenabap={showRenabap}
          showPoints={showPoints}
        />

        {/* Legend Footer */}
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ec4899" }}></span>
              Robo / Sustracción (4.520)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}></span>
              Hallazgo / Descarte (210)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}></span>
              Disparos a Personas (320)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}></span>
              Armas de Fuego (377)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 16, height: 2, background: "#3b82f6", borderTop: "1px dashed #3b82f6" }}></span>
              Vector Robo ➔ Hallazgo
            </span>
          </div>

          <div style={{ fontStyle: "italic", fontSize: "0.75rem" }}>
            Total incidentes renderizados: {filteredPoints.length.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
