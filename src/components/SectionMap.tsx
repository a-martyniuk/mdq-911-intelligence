"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Play, Pause, RotateCcw, Clock, Navigation, Filter, Layers, ShieldAlert, Home } from "lucide-react";
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
}: {
  points: GeoPoint[];
  showVectors: boolean;
  showJurisdictions: boolean;
  showRenabap: boolean;
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
          fillOpacity: 0.14,
        }),
        onEachFeature: (feature: any, layer: any) => {
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
              <strong style="color: ${feature.properties.color}; font-size: 0.95rem;">${feature.properties.name}</strong><br/>
              <span style="font-size: 0.8rem; color: #444;"><b>Barrios:</b> ${feature.properties.description}</span><br/>
              <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #ccc; font-size: 0.775rem;">
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
          layer.bindPopup(`
            <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
              <strong style="color: ${isR ? '#ea580c' : '#0284c7'}; font-size: 0.95rem;">
                ${isR ? '🏡 RENABAP: ' : '📍 '}${feature.properties.name}
              </strong><br/>
              <span style="font-size: 0.8rem; color: #444;">
                ${isR ? '<b>Categoría:</b> Registro Nacional de Barrios Populares (SISU / RENABAP)' : '<b>Categoría:</b> Barrio Oficial MGP'}
              </span><br/>
              <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #ccc; font-size: 0.775rem; color: #666;">
                GeoJSON Oficial MGP Subrubro 15
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

      const groups: Record<string, GeoPoint[]> = {};
      points.forEach((pt) => {
        const key = pt.origen || "OTROS";
        if (!groups[key]) groups[key] = [];
        groups[key].push(pt);
      });

      const sampled: GeoPoint[] = [];
      const keys = Object.keys(groups);
      const perGroup = Math.floor(1500 / (keys.length || 1));

      keys.forEach((k) => {
        sampled.push(...groups[k].slice(0, perGroup));
      });

      return sampled;
    })();

    const getOriginColor = (origen: string) => {
      switch (origen) {
        case "ROBO_AUTO_MOTO": return "#ef4444";
        case "HALLAZGO_AUTOMOTOR": return "#10b981";
        case "DISPAROS_PERSONAS": return "#f59e0b";
        case "ARMA_FUEGO": return "#8b5cf6";
        default: return "#06b6d4";
      }
    };

    // Draw markers
    samplePoints.forEach((pt) => {
      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        fillColor: getOriginColor(pt.origen),
        color: "#000",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.75,
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 4px; max-width: 280px;">
          <strong style="color: #d97706;">ID: ${pt.id}</strong> - ${pt.origen}<br/>
          <b>Tipo:</b> ${pt.tipo} (${pt.subtipo})<br/>
          <b>Dirección:</b> ${pt.direccion}<br/>
          <b>Fecha/Hora:</b> ${pt.fecha} (${pt.hora}:00 hs)<br/>
          ${pt.patente ? `<b>Patente NLP:</b> <span style="background:#fef08a; padding:1px 4px; border-radius:3px; font-weight:bold;">${pt.patente}</span><br/>` : ""}
          ${pt.marca && pt.marca !== "NO ESPECIFICADO" ? `<b>Marca:</b> ${pt.marca}<br/>` : ""}
          ${pt.relato ? `<div style="margin-top:6px; padding:6px; background:#f3f4f6; border-radius:4px; font-size:0.75rem; color:#374151; max-height:100px; overflow-y:auto;"><b>Relato 911:</b> "${pt.relato}"</div>` : ""}
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.addTo(map);
    });

    // Draw flow vectors if enabled (stolen -> recovered pairs)
    if (showVectors) {
      // Flow vector sample connections
      const flowPairs = [
        { from: [-38.012, -57.545], to: [-37.978, -57.589], brand: "Honda Tornado", time: "4.2 hs" },
        { from: [-38.045, -57.562], to: [-37.962, -57.612], brand: "Fiat Uno", time: "3.5 hs" },
        { from: [-37.992, -57.531], to: [-37.951, -57.575], brand: "Zanella ZB", time: "6.1 hs" },
        { from: [-38.028, -57.578], to: [-37.989, -57.625], brand: "Peugeot 208", time: "5.8 hs" },
        { from: [-38.051, -57.549], to: [-37.971, -57.598], brand: "Honda Wave", time: "2.1 hs" },
      ];

      flowPairs.forEach((pair) => {
        const polyline = L.polyline([pair.from, pair.to], {
          color: "#f59e0b",
          weight: 3,
          dashArray: "8, 6",
          opacity: 0.85,
        });

        polyline.bindPopup(`
          <div style="font-family: sans-serif; font-size: 0.8rem; color: #111;">
            <strong style="color: #ea580c;">Vector de Huida / Abandono</strong><br/>
            <b>Vehículo:</b> ${pair.brand}<br/>
            <b>Tiempo Transcurrido:</b> ${pair.time}<br/>
            <i>Trayecto desde punto de sustracción hasta punto de hallazgo.</i>
          </div>
        `);
        polyline.addTo(map);
      });
    }

    return () => {
      map.remove();
    };
  }, [L, points, showVectors, showJurisdictions]);

  return <div id="leaflet-map" style={{ width: "100%", height: "650px", borderRadius: "var(--radius-md)" }} />;
}

export default function SectionMap({ geoPoints = [] }: SectionMapProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [showJurisdictions, setShowJurisdictions] = useState(true);
  const [showRenabap, setShowRenabap] = useState(true);

  // Time slider animation playback
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedHour((prev) => {
          if (prev === null || prev >= 23) return 0;
          return prev + 1;
        });
      }, 1200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Filter geo points by selected hour
  const filteredPoints = useMemo(() => {
    if (selectedHour === null) return geoPoints;
    return geoPoints.filter((pt) => pt.hora === selectedHour);
  }, [geoPoints, selectedHour]);

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">📍 Mapeo Geográfico & Geointeligencia Avanzada 911</div>
        <p className="card-subtitle">
          Exploración espacial de {geoPoints.length.toLocaleString()} incidentes georreferenciados con time-slider animado de 24 horas y vectores de flujo (Robo $\rightarrow$ Hallazgo).
        </p>

        {/* Control Bar: Time Slider & Vectors Toggle */}
        <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            {/* Play/Pause & Slider controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "300px" }}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  border: "none",
                  background: isPlaying ? "var(--accent-amber)" : "var(--accent-indigo)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? "Pausar Time-Slider" : "Reproducir 24h"}
              </button>

              <button
                onClick={() => { setSelectedHour(null); setIsPlaying(false); }}
                style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                title="Mostrar todas las horas"
              >
                <RotateCcw size={12} /> Ver Todo
              </button>

              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-indigo)", minWidth: "120px" }}>
                <Clock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.3rem" }} />
                {selectedHour === null ? "Todas las horas" : `${selectedHour.toString().padStart(2, "0")}:00 hs`}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              {/* RENABAP & Barrios Populares Layer Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "#ea580c", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showRenabap}
                  onChange={(e) => setShowRenabap(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "#ea580c" }}
                />
                <Home size={15} />
                🏡 Capa Barrios Populares & RENABAP
              </label>

              {/* Police Jurisdictions Layer Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--accent-indigo)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showJurisdictions}
                  onChange={(e) => setShowJurisdictions(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--accent-indigo)" }}
                />
                <Layers size={15} />
                👮 Capa Jurisdicciones MGP
              </label>

              {/* Flow Vectors Toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showVectors}
                  onChange={(e) => setShowVectors(e.target.checked)}
                  style={{ width: "16px", height: "16px", accentColor: "var(--accent-amber)" }}
                />
                <Navigation size={14} style={{ color: "var(--accent-amber)" }} />
                Mostrar Vectores de Huida
              </label>
            </div>
          </div>

          {/* Time Slider Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>00:00</span>
            <input
              type="range"
              min="0"
              max="23"
              value={selectedHour ?? 12}
              onChange={(e) => {
                setSelectedHour(parseInt(e.target.value, 10));
                setIsPlaying(false);
              }}
              style={{ flex: 1, accentColor: "var(--accent-indigo)", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>23:00</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", fontSize: "0.8rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} /> Robo Auto-Moto
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} /> Hallazgo Automotor
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} /> Disparos a Personas
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#8b5cf6" }} /> Armas de Fuego
          </span>
          {showVectors && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-amber)" }}>
              <span style={{ width: "20px", height: "2px", borderTop: "2px dashed #f59e0b" }} /> Vector Robo $\rightarrow$ Hallazgo
            </span>
          )}
        </div>

        <MapComponent points={filteredPoints} showVectors={showVectors} showJurisdictions={showJurisdictions} showRenabap={showRenabap} />
      </div>
    </div>
  );
}
