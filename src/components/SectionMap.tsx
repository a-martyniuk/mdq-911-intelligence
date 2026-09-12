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
  recoveries?: any[];
}

function MapComponent({
  points,
  recoveries = [],
  showVectors,
  showJurisdictions,
  showRenabap,
  showPoints,
  showHeatmap = false,
  heatIntensity = "medio",
}: {
  points: GeoPoint[];
  recoveries?: any[];
  showVectors: boolean;
  showJurisdictions: boolean;
  showRenabap: boolean;
  showPoints: boolean;
  showHeatmap?: boolean;
  heatIntensity?: "suave" | "medio" | "intenso";
}) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const heatLayerRef = React.useRef<any>(null);
  const pointsLayerRef = React.useRef<any>(null);
  const vectorsLayerRef = React.useRef<any>(null);
  const jurisLayerRef = React.useRef<any>(null);
  const renabapLayerRef = React.useRef<any>(null);
  const LRef = React.useRef<any>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const HEAT_CALIBRATIONS = {
    suave: {
      radius: 18,
      blur: 14,
      max: 1.4,
      weightNormal: 0.22,
      weightHigh: 0.50,
      minOpacity: 0.18,
      opacity: "0.82",
    },
    medio: {
      radius: 22,
      blur: 16,
      max: 1.0,
      weightNormal: 0.32,
      weightHigh: 0.65,
      minOpacity: 0.22,
      opacity: "0.88",
    },
    intenso: {
      radius: 27,
      blur: 19,
      max: 0.75,
      weightNormal: 0.42,
      weightHigh: 0.85,
      minOpacity: 0.28,
      opacity: "0.95",
    },
  };

  // Initialize Map Once
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      LRef.current = L;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-38.00, -57.56],
          zoom: 12,
        });

        // Polygons custom pane (between tile 200 and overlay 400)
        const polyPane = map.createPane("polygonsPane");
        polyPane.style.zIndex = "350";

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Jurisdictions Layer (in polygonsPane)
        const jurisLayer = L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
          pane: "polygonsPane",
          style: (feature: any) => ({
            color: feature.properties.color || "#6366f1",
            weight: 2,
            opacity: 0.85,
            fillColor: feature.properties.color || "#6366f1",
            fillOpacity: showHeatmap ? 0.04 : 0.12,
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
        });
        jurisLayerRef.current = jurisLayer;

        // RENABAP Layer (in polygonsPane)
        const renabapLayer = L.geoJSON(RENABAP_BARRIOS_GEOJSON, {
          pane: "polygonsPane",
          style: (feature: any) => ({
            color: feature.properties.isRenabap ? "#f97316" : "#38bdf8",
            weight: feature.properties.isRenabap ? 2.5 : 1.2,
            dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
            opacity: 0.9,
            fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
            fillOpacity: feature.properties.isRenabap ? (showHeatmap ? 0.08 : 0.35) : 0.08,
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
        });
        renabapLayerRef.current = renabapLayer;

        pointsLayerRef.current = L.layerGroup().addTo(map);
        vectorsLayerRef.current = L.layerGroup().addTo(map);

        if (showJurisdictions) jurisLayer.addTo(map);
        if (showRenabap) renabapLayer.addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 200);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        pointsLayerRef.current = null;
        vectorsLayerRef.current = null;
        heatLayerRef.current = null;
        jurisLayerRef.current = null;
        renabapLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Toggle Jurisdictions Layer & adjust fill
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !jurisLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = jurisLayerRef.current;
    if (showJurisdictions) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
      layer.setStyle((feature: any) => ({
        color: feature.properties.color || "#6366f1",
        weight: 2,
        opacity: 0.85,
        fillColor: feature.properties.color || "#6366f1",
        fillOpacity: showHeatmap ? 0.04 : 0.12,
      }));
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showJurisdictions, showHeatmap, mapReady]);

  // Toggle RENABAP Layer & adjust fill
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !renabapLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = renabapLayerRef.current;
    if (showRenabap) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
      layer.setStyle((feature: any) => ({
        color: feature.properties.isRenabap ? "#f97316" : "#38bdf8",
        weight: feature.properties.isRenabap ? 2.5 : 1.2,
        dashArray: feature.properties.isRenabap ? "6, 4" : "3, 3",
        opacity: 0.9,
        fillColor: feature.properties.isRenabap ? "#ea580c" : "#0284c7",
        fillOpacity: feature.properties.isRenabap ? (showHeatmap ? 0.08 : 0.35) : 0.08,
      }));
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showRenabap, showHeatmap, mapReady]);

  // Render Continuous Heatmap Layer (leaflet.heat)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap) return;

    import("leaflet").then(async (leafletModule) => {
      const L = leafletModule.default || leafletModule;
      try {
        if (typeof window !== "undefined") {
          (window as any).L = L;
          await import("leaflet.heat");
        }

        const cal = HEAT_CALIBRATIONS[heatIntensity];
        const heatPoints: [number, number, number][] = [];

        points.forEach((pt) => {
          if (!isNaN(pt.lat) && !isNaN(pt.lng) && pt.lat < -37.5 && pt.lat > -38.5 && pt.lng < -57.0 && pt.lng > -58.2) {
            const origen = (pt.origen || pt.tipo || "").toUpperCase();
            const isArmas = origen.includes("ARMA") || origen.includes("DISPARO");
            const isHallazgo = origen.includes("HALLAZGO");
            const weight = isArmas ? cal.weightHigh : isHallazgo ? cal.weightNormal * 0.8 : cal.weightNormal;
            heatPoints.push([pt.lat, pt.lng, weight]);
          }
        });

        if (typeof (L as any).heatLayer === "function" && heatPoints.length > 0) {
          const heat = (L as any).heatLayer(heatPoints, {
            radius: cal.radius,
            blur: cal.blur,
            maxZoom: 15,
            max: cal.max,
            minOpacity: cal.minOpacity,
            gradient: {
              0.15: "#2563eb",
              0.35: "#06b6d4",
              0.55: "#10b981",
              0.70: "#f59e0b",
              0.85: "#ea580c",
              1.00: "#dc2626",
            },
          });
          heat.addTo(map);
          if (heat._canvas) {
            heat._canvas.style.opacity = cal.opacity;
            heat._canvas.style.pointerEvents = "none";
          }
          heatLayerRef.current = heat;
        }
      } catch (err) {
        console.warn("Could not load leaflet.heat in SectionMap:", err);
      }
    });
  }, [showHeatmap, heatIntensity, points, mapReady]);

  // Update Points Layer Group (dynamic time slider / filter)
  useEffect(() => {
    if (!mapReady) return;
    const layerGroup = pointsLayerRef.current;
    const L = LRef.current;
    if (!layerGroup || !L) return;

    layerGroup.clearLayers();
    if (!showPoints || !points || points.length === 0) return;

    const samplePoints = (() => {
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

    samplePoints.forEach((pt) => {
      const origenUpper = (pt.origen || pt.tipo || "").toUpperCase();
      const isHallazgos = origenUpper.includes("HALLAZGO");
      const isDisparos = origenUpper.includes("DISPARO");
      const isArmas = origenUpper.includes("ARMA");

      const color = isHallazgos ? "#10b981" : isDisparos ? "#f59e0b" : isArmas ? "#dc2626" : "#ef4444";

      const marker = L.circleMarker([pt.lat, pt.lng], {
        radius: isHallazgos ? 6.5 : 5,
        fillColor: color,
        color: "#ffffff",
        weight: 1.2,
        opacity: 0.9,
        fillOpacity: 0.8,
      });

      const popupContent = `
        <div style="font-family: var(--font-sans), sans-serif; font-size: 0.825rem; color: #f8fafc; padding: 0.2rem; max-width: 280px;">
          <strong style="color: ${color}; font-size: 0.92rem; display: block; margin-bottom: 0.25rem;">${pt.tipo} (${pt.subtipo || "General"})</strong>
          <span style="color: #cbd5e1;"><b style="color: #f8fafc;">ID:</b> #${pt.id} | <b style="color: #f8fafc;">Origen:</b> ${pt.origen}</span><br/>
          <span style="color: #cbd5e1;"><b style="color: #f8fafc;">Fecha/Hora:</b> ${pt.fecha} - ${pt.hora}:00 hs</span><br/>
          <span style="color: #cbd5e1;"><b style="color: #f8fafc;">Dirección:</b> ${pt.direccion}</span><br/>
          ${pt.marca ? `<span style="color: #cbd5e1;"><b style="color: #f8fafc;">Marca:</b> ${pt.marca}</span><br/>` : ""}
          ${pt.patente ? `<span style="color: #cbd5e1;"><b style="color: #f8fafc;">Patente:</b> ${pt.patente}</span><br/>` : ""}
          ${pt.relato ? `<div style="margin-top:0.4rem; font-style:italic; font-size:0.75rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#e2e8f0; padding:0.45rem; border-radius:4px; line-height:1.4;">"${pt.relato.slice(0, 120)}..."</div>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(layerGroup);
    });
  }, [points, showPoints, mapReady]);

  // Update Vectors Layer Group
  useEffect(() => {
    if (!mapReady) return;
    const layerGroup = vectorsLayerRef.current;
    const L = LRef.current;
    if (!layerGroup || !L) return;

    layerGroup.clearLayers();
    if (!showVectors || !recoveries || recoveries.length === 0) return;

    recoveries.forEach((c) => {
      const latRobo = c.Latitud_Clean_Robo || c.Latitud_Robo;
      const lngRobo = c.Longitud_Clean_Robo || c.Longitud_Robo;
      const latHall = c.Latitud_Clean_Hallazgo || c.Latitud_Hallazgo;
      const lngHall = c.Longitud_Clean_Hallazgo || c.Longitud_Hallazgo;

      if (latRobo && lngRobo && latHall && lngHall) {
        const polyline = L.polyline(
          [
            [latRobo, lngRobo],
            [latHall, lngHall],
          ],
          {
            color: "#3b82f6",
            weight: 3,
            opacity: 0.9,
            dashArray: "6, 6",
          }
        );

        polyline.bindPopup(`
          <div style="font-family: var(--font-sans), sans-serif; font-size: 0.8rem; color: #f8fafc; padding: 0.2rem; max-width: 260px;">
            <strong style="color: #60a5fa; font-size: 0.9rem; display: block; margin-bottom: 0.25rem;">Vector Robo ➔ Hallazgo (Patente ${c.Patente_Principal || "Emparejada"})</strong>
            <span style="color: #cbd5e1;"><b style="color: #f8fafc;">🔴 Origen Sustracción:</b> ${c.Dirección_Robo || "Macrocentro"}</span><br/>
            <span style="color: #cbd5e1;"><b style="color: #f8fafc;">🟢 Destino Descarte:</b> ${c.Dirección_Hallazgo || "Periferia / Descarte"}</span><br/>
            <span style="color: #cbd5e1;"><b style="color: #f8fafc;">⏱️ Diferencial de Tiempo:</b> ${typeof c.Horas_Hasta_Hallazgo === "number" ? c.Horas_Hasta_Hallazgo.toFixed(1) : c.Horas_Hasta_Hallazgo} hs</span>
          </div>
        `);

        polyline.addTo(layerGroup);

        // Theft Marker (Red)
        L.circleMarker([latRobo, lngRobo], {
          radius: 6,
          fillColor: "#ef4444",
          color: "#ffffff",
          weight: 1.5,
          fillOpacity: 0.9,
        }).bindPopup(`<b>🔴 Sustracción: Patente ${c.Patente_Principal}</b><br/>${c.Dirección_Robo || ""}`).addTo(layerGroup);

        // Recovery Marker (Green)
        L.circleMarker([latHall, lngHall], {
          radius: 6,
          fillColor: "#10b981",
          color: "#ffffff",
          weight: 1.5,
          fillOpacity: 0.9,
        }).bindPopup(`<b>🟢 Hallazgo / Descarte: Patente ${c.Patente_Principal}</b><br/>${c.Dirección_Hallazgo || ""}`).addTo(layerGroup);
      }
    });
  }, [recoveries, showVectors, mapReady]);

  return (
    <div
      ref={mapContainerRef}
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

export default function SectionMap({ geoPoints = [], recoveries = [] }: SectionMapProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Layer switches states
  const [showPoints, setShowPoints] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatIntensity, setHeatIntensity] = useState<"suave" | "medio" | "intenso">("medio");
  const [showVectors, setShowVectors] = useState(true);
  const [showJurisdictions, setShowJurisdictions] = useState(true);
  const [showRenabap, setShowRenabap] = useState(true);

  // Filter geoPoints by hour slider
  const filteredPoints = useMemo(() => {
    if (selectedHour === null) return geoPoints;
    return geoPoints.filter((pt) => pt.hora === selectedHour);
  }, [geoPoints, selectedHour]);

  // Dynamic count calculation for legend from filtered points
  const counts = useMemo(() => {
    let robos = 0, hallazgos = 0, disparos = 0, armas = 0;
    filteredPoints.forEach((pt) => {
      const o = (pt.origen || pt.tipo || "").toUpperCase();
      if (o.includes("HALLAZGO")) hallazgos++;
      else if (o.includes("DISPARO")) disparos++;
      else if (o.includes("ARMA")) armas++;
      else robos++;
    });
    return { robos, hallazgos, disparos, armas };
  }, [filteredPoints]);

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
    <div className="animate-enter">
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title">Mapeo Geográfico & Geointeligencia Avanzada 911</div>
        <p className="card-subtitle">
          Exploración espacial de {geoPoints.length.toLocaleString()} incidentes georreferenciados con time-slider animado de 24 horas y vectores de flujo (Robo &rarr; Hallazgo).
        </p>

        {/* UNIFIED MAP LAYER SELECTOR PANEL */}
        <div style={{ background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          
          {/* Header & Quick Presets Bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", fontWeight: 600, fontSize: "14px" }}>
              <Layers size={18} color="#38bdf8" />
              <span>Selector Global de Capas del Mapa</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Modos Rápidos:</span>
              <button
                onClick={() => applyPreset("all")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "12px", fontWeight: 600, borderRadius: "var(--radius-xs)", border: "1px solid rgba(56, 189, 248, 0.4)", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Zap size={12} /> Todas las Capas
              </button>
              <button
                onClick={() => applyPreset("renabap")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "12px", fontWeight: 600, borderRadius: "var(--radius-xs)", border: "1px solid rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.12)", color: "#fcd34d", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Home size={12} /> Enfriamiento RENABAP
              </button>
              <button
                onClick={() => applyPreset("jurisdictions")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "12px", fontWeight: 600, borderRadius: "var(--radius-xs)", border: "1px solid rgba(168, 85, 247, 0.4)", background: "rgba(168, 85, 247, 0.12)", color: "#d8b4fe", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Layers size={12} /> Comisarías
              </button>
              <button
                onClick={() => applyPreset("points_only")}
                style={{ padding: "0.3rem 0.65rem", fontSize: "12px", fontWeight: 600, borderRadius: "var(--radius-xs)", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Eye size={12} /> Solo Puntos 911
              </button>
            </div>
          </div>

          {/* Individual Interactive Checkbox Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {/* Layer 1: 911 Incidents Points */}
            <label onClick={() => setShowPoints(!showPoints)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showPoints ? "#ecfdf5" : "var(--bg-base)", border: `1px solid ${showPoints ? "#10b981" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showPoints ? <CheckSquare size={16} color="#059669" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showPoints ? "#047857" : "var(--text-primary)" }}>
                  📍 Puntos & Incidentes 911
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  {filteredPoints.length.toLocaleString()} eventos georreferenciados
                </div>
              </div>
            </label>

            {/* Layer 2: Trajectory Vectors */}
            <label onClick={() => setShowVectors(!showVectors)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showVectors ? "#eff6ff" : "var(--bg-base)", border: `1px solid ${showVectors ? "#3b82f6" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showVectors ? <CheckSquare size={16} color="#2563eb" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showVectors ? "#1d4ed8" : "var(--text-primary)" }}>
                  ➡️ Vectores Robo ➔ Hallazgo
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Flujos de abandono de vehículos
                </div>
              </div>
            </label>

            {/* Layer 3: Police Jurisdictions */}
            <label onClick={() => setShowJurisdictions(!showJurisdictions)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showJurisdictions ? "#eff6ff" : "var(--bg-base)", border: `1px solid ${showJurisdictions ? "var(--accent-pba-blue)" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showJurisdictions ? <CheckSquare size={16} color="var(--accent-pba-blue)" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showJurisdictions ? "var(--accent-pba-blue)" : "var(--text-primary)" }}>
                  👮 Comisarías 1ra a 16ta
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  Polígonos oficiales MGP Subrubro 122
                </div>
              </div>
            </label>

            {/* Layer 4: RENABAP Barrios Populares */}
            <label onClick={() => setShowRenabap(!showRenabap)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0.75rem", background: showRenabap ? "#fff7ed" : "var(--bg-base)", border: `1px solid ${showRenabap ? "#ea580c" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer" }}>
              {showRenabap ? <CheckSquare size={16} color="#ea580c" /> : <Square size={16} color="var(--text-muted)" />}
              <div>
                <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showRenabap ? "#c2410c" : "var(--text-primary)" }}>
                  🏡 Asentamientos RENABAP
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  58 polígonos SHP 2023 (SISU)
                </div>
              </div>
            </label>

            {/* Layer 5: Heatmap 911 */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              padding: "0.5rem 0.75rem",
              background: showHeatmap ? "#fee2e2" : "var(--bg-base)",
              border: `1px solid ${showHeatmap ? "#ef4444" : "var(--border)"}`,
              borderRadius: "6px",
            }}>
              <label onClick={() => setShowHeatmap(!showHeatmap)} style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer" }}>
                {showHeatmap ? <CheckSquare size={16} color="#dc2626" /> : <Square size={16} color="var(--text-muted)" />}
                <div>
                  <div style={{ fontSize: "0.825rem", fontWeight: 700, color: showHeatmap ? "#b91c1c" : "var(--text-primary)" }}>
                    🔥 Heatmap 911 (Densidad)
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    Mancha térmica continua KDE
                  </div>
                </div>
              </label>

              {showHeatmap && (
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px",
                  background: "rgba(255, 255, 255, 0.8)",
                  padding: "2px 4px",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid #fca5a5",
                  marginTop: "2px",
                }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "0 3px", fontWeight: 600 }}>
                    Nivel:
                  </span>
                  {(["suave", "medio", "intenso"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeatIntensity(lvl);
                      }}
                      style={{
                        padding: "1px 6px",
                        fontSize: "10px",
                        fontWeight: 700,
                        borderRadius: "3px",
                        border: heatIntensity === lvl ? "1px solid #fca5a5" : "1px solid transparent",
                        background: heatIntensity === lvl ? "#fee2e2" : "transparent",
                        color: heatIntensity === lvl ? "#b91c1c" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        textTransform: "capitalize",
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
          recoveries={recoveries}
          showVectors={showVectors}
          showJurisdictions={showJurisdictions}
          showRenabap={showRenabap}
          showPoints={showPoints}
          showHeatmap={showHeatmap}
          heatIntensity={heatIntensity}
        />

        {/* Legend Footer */}
        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }}></span>
              Robo / Sustracción ({counts.robos.toLocaleString()})
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }}></span>
              Hallazgo / Descarte ({counts.hallazgos.toLocaleString()})
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }}></span>
              Disparos a Personas ({counts.disparos.toLocaleString()})
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626" }}></span>
              Armas de Fuego ({counts.armas.toLocaleString()})
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
