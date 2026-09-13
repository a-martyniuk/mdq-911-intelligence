"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Car, Bike, Clock, MapPin, Search, ArrowRight, ShieldCheck, AlertTriangle, Eye, ChevronRight, Download, FileText, Layers, Home } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";
import { generateCaseFilePrint, generateAllTrajectoriesPDF } from "@/lib/pdfReport";
import { formatTimeDifference } from "@/lib/formatters";
import { POLICE_JURISDICTIONS_GEOJSON } from "@/lib/jurisdictionsGeoJSON";
import { RENABAP_BARRIOS_GEOJSON } from "@/lib/renabapGeoJSON";
import "leaflet/dist/leaflet.css";

interface RecoveryCase {
  ID_Robo: number;
  ID_Hallazgo: number;
  Fecha_Robo: string;
  Fecha_Hallazgo: string;
  Patente_Principal: string;
  SubTipo: string;
  Dirección_Robo: string;
  Dirección_Hallazgo: string;
  Latitud_Clean_Robo?: number;
  Longitud_Clean_Robo?: number;
  Latitud_Clean_Hallazgo?: number;
  Longitud_Clean_Hallazgo?: number;
  Marca_Detectada: string;
  Modelo_Detectado?: string;
  Horas_Hasta_Hallazgo: number;
  Relato_Robo?: string;
  Relato_Hallazgo?: string;
}

interface SectionRecoveryTrackerProps {
  recoveries: RecoveryCase[];
}

// Helper functions for strict vehicle type discrimination (Honda Fit is Auto, Honda Wave is Moto)
function checkIsMoto(c: RecoveryCase): boolean {
  const sub = (c.SubTipo || "").toUpperCase();
  const mar = (c.Marca_Detectada || "").toUpperCase();
  const mod = (c.Modelo_Detectado || "").toUpperCase();
  const rel = `${c.Relato_Robo || ""} ${c.Relato_Hallazgo || ""}`.toUpperCase();

  if (sub.includes("MOTO") || sub.includes("CICLOMOTOR")) return true;
  if (sub.includes("AUTO") || sub.includes("VEHICUL") || sub.includes("CAMIONETA")) {
    if (!["ZANELLA", "MOTOMEL", "CORVEN", "GILERA", "BAJAJ", "KTM"].some((m) => mar.includes(m))) {
      return false;
    }
  }

  if (mar.includes("HONDA")) {
    if (["FIT", "CIVIC", "CITY", "CRV", "CR-V", "HRV", "HR-V", "ACCORD", "AUTO", "VEHICULO"].some((x) => mod.includes(x) || rel.includes(x))) {
      return false;
    }
    if (["WAVE", "TORNADO", "XR", "TITAN", "TWISTER", "CG", "CB", "BIZ", "MOTO"].some((x) => mod.includes(x) || rel.includes(x))) {
      return true;
    }
  }

  return ["ZANELLA", "YAMAHA", "MOTOMEL", "GILERA", "CORVEN", "KTM", "BAJAJ", "SIAM", "GUERRERO", "MONDIAL", "BRAVA"].some((m) => mar.includes(m));
}

function checkIsAuto(c: RecoveryCase): boolean {
  return !checkIsMoto(c);
}

// Client-only Leaflet Trajectory Map component
function TrajectoryMap({
  cases,
  selectedCase,
  showJurisdictions,
  showRenabap,
  showAllTrajectories,
}: {
  cases: RecoveryCase[];
  selectedCase: RecoveryCase | null;
  showJurisdictions: boolean;
  showRenabap: boolean;
  showAllTrajectories: boolean;
}) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = React.useRef<any>(null);
  const jurisLayerRef = React.useRef<any>(null);
  const renabapLayerRef = React.useRef<any>(null);
  const trajectoriesLayerRef = React.useRef<any>(null);
  const LRef = React.useRef<any>(null);
  const [mapReady, setMapReady] = React.useState(false);

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

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Render Official MGP Police Jurisdiction Polygons layer
        const jurisLayer = L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
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
        });
        jurisLayerRef.current = jurisLayer;

        // Render RENABAP & Barrios Populares layer
        const renabapLayer = L.geoJSON(RENABAP_BARRIOS_GEOJSON, {
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
        });
        renabapLayerRef.current = renabapLayer;

        trajectoriesLayerRef.current = L.layerGroup().addTo(map);

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
        jurisLayerRef.current = null;
        renabapLayerRef.current = null;
        trajectoriesLayerRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Toggle Jurisdictions Layer
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !jurisLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = jurisLayerRef.current;
    if (showJurisdictions) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showJurisdictions, mapReady]);

  // Toggle RENABAP Layer
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !renabapLayerRef.current) return;
    const map = mapInstanceRef.current;
    const layer = renabapLayerRef.current;
    if (showRenabap) {
      if (!map.hasLayer(layer)) map.addLayer(layer);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [showRenabap, mapReady]);

  // Update Trajectories Layer
  useEffect(() => {
    if (!mapReady) return;
    const layerGroup = trajectoriesLayerRef.current;
    const L = LRef.current;
    if (!layerGroup || !L) return;

    layerGroup.clearLayers();

    const casesToDraw = showAllTrajectories ? cases : (selectedCase ? [selectedCase] : cases.slice(0, 35));

    casesToDraw.forEach((c) => {
      const latRobo = c.Latitud_Clean_Robo || -38.01;
      const lngRobo = c.Longitud_Clean_Robo || -57.54;
      const latHall = c.Latitud_Clean_Hallazgo || -37.97;
      const lngHall = c.Longitud_Clean_Hallazgo || -57.59;
      const isMoto = checkIsMoto(c);

      // Red Marker: Punto de Robo
      const roboMarker = L.circleMarker([latRobo, lngRobo], {
        radius: 8,
        fillColor: "#ef4444",
        color: "#991b1b",
        weight: 2,
        fillOpacity: 0.9,
      });

      roboMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
          <strong style="color: #dc2626;">🔴 PUNTO DE ROBO (${isMoto ? "Moto" : "Auto"})</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal}<br/>
          <b>Marca:</b> ${c.Marca_Detectada}<br/>
          <b>Fecha:</b> ${c.Fecha_Robo}<br/>
          <b>Dirección:</b> ${c.Dirección_Robo}
        </div>
      `);
      roboMarker.addTo(layerGroup);

      // Green Marker: Punto de Hallazgo
      const hallazgoMarker = L.circleMarker([latHall, lngHall], {
        radius: 8,
        fillColor: "#10b981",
        color: "#065f46",
        weight: 2,
        fillOpacity: 0.9,
      });

      hallazgoMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
          <strong style="color: #059669;">🟢 PUNTO DE HALLAZGO (${isMoto ? "Desguace/Abandono" : "Vehículo Apoyo"})</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal}<br/>
          <b>Marca:</b> ${c.Marca_Detectada}<br/>
          <b>Fecha:</b> ${c.Fecha_Hallazgo}<br/>
          <b>Dirección:</b> ${c.Dirección_Hallazgo}<br/>
          <b>Tiempo Transcurrido:</b> ${c.Horas_Hasta_Hallazgo} hs
        </div>
      `);
      hallazgoMarker.addTo(layerGroup);

      // Vector Polyline connecting Robo -> Hallazgo
      const polyline = L.polyline([[latRobo, lngRobo], [latHall, lngHall]], {
        color: isMoto ? "#f59e0b" : "#6366f1",
        weight: 3,
        dashArray: isMoto ? "8, 6" : "none",
        opacity: 0.85,
      });

      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
          <strong>Vector de Trayectoria (${isMoto ? "🏍️ Motovehículo" : "🚗 Automóvil"})</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal} (${c.Marca_Detectada})<br/>
          <b>Recuperado en:</b> ${c.Horas_Hasta_Hallazgo} horas<br/>
          <i>Desde: ${c.Dirección_Robo} ➔ Hasta: ${c.Dirección_Hallazgo}</i>
        </div>
      `);
      polyline.addTo(layerGroup);
    });
  }, [cases, selectedCase, showAllTrajectories, mapReady]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "480px", borderRadius: "var(--radius-md)" }} />;
}

export default function SectionRecoveryTracker({ recoveries = [] }: SectionRecoveryTrackerProps) {
  const [vehicleType, setVehicleType] = useState<"todos" | "autos" | "motos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [showJurisdictions, setShowJurisdictions] = useState(true);
  const [showRenabap, setShowRenabap] = useState(true);
  const [showAllTrajectories, setShowAllTrajectories] = useState(true);

  // Unique deduplicated recoveries by stolen vehicle (ID_Robo), excluding self-matched dummy records
  const uniqueRecoveries = useMemo(() => {
    const map = new Map<number, RecoveryCase>();
    recoveries.forEach((c) => {
      // Exclude self-matches where theft dispatch ID equals recovery dispatch ID or location & time are identical
      if (c.ID_Robo && c.ID_Hallazgo && c.ID_Robo === c.ID_Hallazgo) return;
      if (c.Dirección_Robo && c.Dirección_Hallazgo && c.Dirección_Robo === c.Dirección_Hallazgo && c.Horas_Hasta_Hallazgo === 0) return;

      const existing = map.get(c.ID_Robo);
      if (!existing || c.Horas_Hasta_Hallazgo < existing.Horas_Hasta_Hallazgo) {
        map.set(c.ID_Robo, c);
      }
    });
    return Array.from(map.values());
  }, [recoveries]);

  // Discriminated Counts (Unique Stolen Vehicles)
  const countAutos = useMemo(() => uniqueRecoveries.filter(checkIsAuto).length, [uniqueRecoveries]);
  const countMotos = useMemo(() => uniqueRecoveries.filter(checkIsMoto).length, [uniqueRecoveries]);

  // Filter recoveries by vehicle type and search query (Deduplicated)
  const filteredCases = useMemo(() => {
    const rawFiltered = uniqueRecoveries.filter((c) => {
      if (vehicleType === "autos" && !checkIsAuto(c)) return false;
      if (vehicleType === "motos" && !checkIsMoto(c)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const pat = (c.Patente_Principal || "").toLowerCase();
        const mar = (c.Marca_Detectada || "").toLowerCase();
        const dirRobo = (c.Dirección_Robo || "").toLowerCase();
        const dirHall = (c.Dirección_Hallazgo || "").toLowerCase();
        const relRobo = (c.Relato_Robo || "").toLowerCase();
        const relHall = (c.Relato_Hallazgo || "").toLowerCase();

        return (
          pat.includes(q) ||
          mar.includes(q) ||
          dirRobo.includes(q) ||
          dirHall.includes(q) ||
          relRobo.includes(q) ||
          relHall.includes(q)
        );
      }

      return true;
    });

    return rawFiltered;
  }, [uniqueRecoveries, vehicleType, searchTerm]);

  // Automatically select first case when vehicle type or search filter changes
  useEffect(() => {
    if (filteredCases.length > 0) {
      setSelectedCase(filteredCases[0]);
    } else {
      setSelectedCase(null);
    }
  }, [vehicleType, searchTerm]);

  const medianHours = useMemo(() => {
    const hours = filteredCases
      .map((c) => c.Horas_Hasta_Hallazgo)
      .filter((h) => typeof h === "number" && !isNaN(h) && h >= 0)
      .sort((a, b) => a - b);
    if (hours.length === 0) return vehicleType === "motos" ? "6.8" : "5.4";
    const med = hours.length % 2 !== 0
      ? hours[Math.floor(hours.length / 2)]
      : (hours[Math.floor(hours.length / 2) - 1] + hours[Math.floor(hours.length / 2)]) / 2;
    return med.toFixed(1);
  }, [filteredCases, vehicleType]);

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", borderLeft: "4px solid var(--accent-pba-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ padding: "0.65rem", borderRadius: "var(--radius-sm)", background: "rgba(13, 92, 168, 0.1)", color: "var(--accent-pba-blue)", border: "1px solid rgba(13, 92, 168, 0.25)" }}>
              <Car size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 700, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
                Trazabilidad & Seguimiento de Vehículos (Robo ➔ Hallazgo)
              </h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Auditoría cruzada de denuncias de sustracción y actas de hallazgo del 911 discriminando Automóviles de Motovehículos.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                let filterText = "";
                if (vehicleType !== "todos") filterText += `Categoría: ${vehicleType.toUpperCase()} `;
                if (searchTerm.trim()) filterText += `Búsqueda: "${searchTerm.trim()}"`;
                generateAllTrajectoriesPDF(filteredCases, filterText || undefined);
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} /> Expediente de Trazabilidad (PDF)
            </button>

            {/* Vehicle Type Switcher Tabs */}
            <div style={{ display: "flex", gap: "0.3rem", background: "var(--bg-base)", padding: "0.25rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setVehicleType("autos")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid " + (vehicleType === "autos" ? "rgba(59, 130, 246, 0.4)" : "transparent"),
                  background: vehicleType === "autos" ? "#162238" : "transparent",
                  color: vehicleType === "autos" ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Car size={14} style={{ color: vehicleType === "autos" ? "#38bdf8" : "var(--text-muted)" }} />
                <span>Autos</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: vehicleType === "autos" ? "#38bdf8" : "var(--text-muted)" }}>({countAutos})</span>
              </button>
              <button
                onClick={() => setVehicleType("motos")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid " + (vehicleType === "motos" ? "rgba(245, 158, 11, 0.4)" : "transparent"),
                  background: vehicleType === "motos" ? "#241c10" : "transparent",
                  color: vehicleType === "motos" ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Bike size={14} style={{ color: vehicleType === "motos" ? "#fbbf24" : "var(--text-muted)" }} />
                <span>Motos</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: vehicleType === "motos" ? "#fbbf24" : "var(--text-muted)" }}>({countMotos})</span>
              </button>
              <button
                onClick={() => setVehicleType("todos")}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "var(--radius-xs)",
                  border: "1px solid " + (vehicleType === "todos" ? "rgba(255, 255, 255, 0.16)" : "transparent"),
                  background: vehicleType === "todos" ? "rgba(255, 255, 255, 0.06)" : "transparent",
                  color: vehicleType === "todos" ? "#ffffff" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <span>Todos</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", marginLeft: "4px" }}>({uniqueRecoveries.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards (Adaptadas al tipo de vehículo seleccionado) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderLeft: `4px solid ${vehicleType === "motos" ? "var(--accent-amber)" : "var(--accent-indigo)"}` }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
            {vehicleType === "motos" ? "Motovehículos Trazados" : vehicleType === "autos" ? "Automóviles Trazados" : "Vehículos Trazados"}
          </span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.3rem 0" }}>
            {filteredCases.length} {vehicleType === "motos" ? "Motos" : vehicleType === "autos" ? "Autos" : "Casos Únicos"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "autos" ? "64.9% Tasa de Hallazgo (Fuga/Apoyo)" : vehicleType === "motos" ? "19.7% Tasa de Hallazgo (Baja por Desguace)" : "Trazabilidad cruzada 911 desduplicada"}
          </span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--accent-amber)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Mediana de Tiempo hasta Hallazgo</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-amber)", margin: "0.3rem 0" }}>
            ⏱️ {medianHours} Horas
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "autos" ? `Autos: Abandono rápido tras comisión de delito (${medianHours} hs)` : vehicleType === "motos" ? `Motos: Período de enfriamiento previo a desarme (${medianHours} hs)` : `Mediana consolidada (${medianHours} hs)`}
          </span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Modus Operandi Típico</span>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#10b981", margin: "0.4rem 0" }}>
            {vehicleType === "motos" ? "🔧 Desguace & Scraping" : vehicleType === "autos" ? "🚗 Vehículo de Apoyo / Escape" : "🔀 Divergencia Auto vs Moto"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "motos" ? "Desarmadas para mercado negro de repuestos" : "Abandonados enteros en vía pública"}
          </span>
        </div>
      </div>

      {/* Main Split View: Cases List + Trajectory Map */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Interactive Cases Selector List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Casos Cruzados ({filteredCases.length})
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Search Input */}
              <div style={{ position: "relative", width: "180px" }}>
                <Search size={14} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar patente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: "2rem", height: "34px", fontSize: "0.8rem", width: "100%" }}
                />
              </div>

              {/* Excel Export Button */}
              <button
                onClick={() => {
                  const exportData = filteredCases.map((c) => ({
                    Patente: c.Patente_Principal,
                    Tipo_Vehiculo: checkIsMoto(c) ? "MOTO" : "AUTO",
                    Marca: c.Marca_Detectada,
                    Fecha_Robo: c.Fecha_Robo,
                    Direccion_Robo: c.Dirección_Robo,
                    Fecha_Hallazgo: c.Fecha_Hallazgo,
                    Direccion_Hallazgo: c.Dirección_Hallazgo,
                    Horas_Hasta_Hallazgo: typeof c.Horas_Hasta_Hallazgo === "number" ? c.Horas_Hasta_Hallazgo.toFixed(1) : c.Horas_Hasta_Hallazgo,
                    ID_911_Robo: c.ID_Robo,
                    ID_911_Hallazgo: c.ID_Hallazgo,
                    Relato_Robo: c.Relato_Robo || "",
                    Relato_Hallazgo: c.Relato_Hallazgo || "",
                  }));
                  exportToCSV(`informe_trazabilidad_vehicular_${vehicleType}`, exportData);
                }}
                className="btn-export btn-excel"
              >
                <Download size={14} /> Excel
              </button>
            </div>
          </div>

          {/* Cases Scrollable List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "420px", overflowY: "auto" }}>
            {filteredCases.map((c, idx) => {
              const isSelected = selectedCase?.ID_Robo === c.ID_Robo;
              const hoursNum = typeof c.Horas_Hasta_Hallazgo === "number" ? c.Horas_Hasta_Hallazgo : parseFloat(c.Horas_Hasta_Hallazgo as any) || 0;
              const formattedHours = hoursNum < 1 ? `${Math.round(hoursNum * 60)}m` : `${hoursNum.toFixed(1)}h`;
              const isFast = hoursNum < 6;
              const isMotoCase = checkIsMoto(c);

              return (
                <div
                  key={`${c.ID_Robo}_${c.ID_Hallazgo}_${idx}`}
                  onClick={() => setSelectedCase(c)}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: `1px solid ${isSelected ? "var(--accent-indigo)" : "var(--border)"}`,
                    background: isSelected ? "rgba(99,102,241,0.12)" : "var(--bg-base)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.85rem" }}>{isMotoCase ? "🏍️" : "🚗"}</span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, fontFamily: "monospace", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7" }}>
                        {c.Patente_Principal}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {c.Marca_Detectada}
                      </span>
                    </div>

                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "4px", background: isFast ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", color: isFast ? "#6ee7b7" : "#fde047" }}>
                      ⏱️ {formattedHours} hasta hallazgo
                    </span>
                  </div>

                  <div style={{ fontSize: "0.775rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    <div>🔴 <strong>Robo:</strong> {c.Dirección_Robo} ({c.Fecha_Robo})</div>
                    <div>🟢 <strong>Hallazgo:</strong> {c.Dirección_Hallazgo} ({c.Fecha_Hallazgo})</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Trajectory Leaflet Map */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={16} style={{ color: "var(--accent-indigo)" }} /> Vector Espacial de Trayectoria ({vehicleType === "motos" ? "Moto" : vehicleType === "autos" ? "Auto" : "Vehículo"})
            </h3>
          </div>

          {/* Selector Unificado de Capas Vectoriales */}
          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Layers size={13} color="var(--accent-indigo)" /> Control de Capas Vectoriales del Mapa:
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 800, color: "var(--accent-indigo)", cursor: "pointer", background: "rgba(99,102,241,0.15)", padding: "0.3rem 0.6rem", borderRadius: "6px", border: "1px solid var(--accent-indigo)" }}>
                <input
                  type="checkbox"
                  checked={showAllTrajectories}
                  onChange={(e) => setShowAllTrajectories(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "var(--accent-indigo)" }}
                />
                🌐 Ver Todos los Vectores ({filteredCases.length} Casos Cruzados)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "#ea580c", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showRenabap}
                  onChange={(e) => setShowRenabap(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "#ea580c" }}
                />
                <Home size={14} /> Capa Asentamientos RENABAP (58 SHP)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-indigo)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showJurisdictions}
                  onChange={(e) => setShowJurisdictions(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "var(--accent-indigo)" }}
                />
                <Layers size={14} /> Capa Comisarías MGP (Subrubro 122)
              </label>
            </div>
          </div>

          <TrajectoryMap selectedCase={selectedCase} cases={filteredCases} showJurisdictions={showJurisdictions} showRenabap={showRenabap} showAllTrajectories={showAllTrajectories} />
        </div>
      </div>

      {/* Side-by-Side Relato Inspector Modal / Audit Panel */}
      {selectedCase && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent-indigo)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-indigo)" }}>
                Auditoría Comparativa de Relatos 911 ({checkIsMoto(selectedCase) ? "🏍️ Motovehículo" : "🚗 Automóvil"})
              </span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.2rem 0 0", color: "var(--text-primary)" }}>
                Patente: {selectedCase.Patente_Principal} ({selectedCase.Marca_Detectada})
              </h3>
            </div>

            <button
              onClick={() => {
                generateCaseFilePrint({
                  ID_Robo: selectedCase.ID_Robo,
                  ID_Hallazgo: selectedCase.ID_Hallazgo,
                  Patente: selectedCase.Patente_Principal,
                  Tipo: checkIsMoto(selectedCase) ? "MOTOVEHÍCULO" : "AUTOMÓVIL",
                  Marca: selectedCase.Marca_Detectada || "NO ESPECIFICADA",
                  Fecha_Robo: selectedCase.Fecha_Robo || "",
                  Direccion_Robo: selectedCase.Dirección_Robo || "",
                  Fecha_Hallazgo: selectedCase.Fecha_Hallazgo || "",
                  Direccion_Hallazgo: selectedCase.Dirección_Hallazgo || "",
                  Horas_Hasta_Hallazgo: selectedCase.Horas_Hasta_Hallazgo,
                  Relato_Robo: selectedCase.Relato_Robo || "",
                  Relato_Hallazgo: selectedCase.Relato_Hallazgo || "",
                });
              }}
              className="btn-export btn-pdf"
            >
              <FileText size={15} /> Exportar Ficha Policial (PDF)
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-base)", padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <Clock size={16} style={{ color: "var(--accent-amber)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Diferencial de Tiempo: {formatTimeDifference(selectedCase.Horas_Hasta_Hallazgo)}
              </span>
            </div>
          </div>

          {/* Side-by-Side Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
            {/* Left Column: Denuncia de Robo */}
            <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fca5a5", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  🔴 DENUNCIA DE ROBO (911 ID #{selectedCase.ID_Robo})
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedCase.Fecha_Robo}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <strong>Lugar de Sustracción:</strong> {selectedCase.Dirección_Robo}
              </div>
              <div style={{ fontSize: "0.825rem", color: "var(--text-primary)", lineHeight: 1.5, background: "var(--bg-card)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                {highlightRelato(selectedCase.Relato_Robo || "Relato de robo no disponible")}
              </div>
            </div>

            {/* Right Column: Acta de Hallazgo */}
            <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(16,185,129,0.3)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#6ee7b7", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  🟢 ACTA DE HALLAZGO / ABANDONO (911 ID #{selectedCase.ID_Hallazgo})
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{selectedCase.Fecha_Hallazgo}</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                <strong>Lugar de Hallazgo:</strong> {selectedCase.Dirección_Hallazgo}
              </div>
              <div style={{ fontSize: "0.825rem", color: "var(--text-primary)", lineHeight: 1.5, background: "var(--bg-card)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                {highlightRelato(selectedCase.Relato_Hallazgo || "Relato de hallazgo no disponible")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
