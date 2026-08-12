"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Car, Bike, Clock, MapPin, Search, ArrowRight, ShieldCheck, AlertTriangle, Eye, ChevronRight } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
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
  Horas_Hasta_Hallazgo: number;
  Relato_Robo?: string;
  Relato_Hallazgo?: string;
}

interface SectionRecoveryTrackerProps {
  recoveries: RecoveryCase[];
}

// Client-only Leaflet Trajectory Map component
function TrajectoryMap({ selectedCase, cases }: { selectedCase: RecoveryCase | null; cases: RecoveryCase[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    // Center map around selected case if available, else central Mar del Plata
    const centerLat = selectedCase?.Latitud_Clean_Robo || -38.00;
    const centerLng = selectedCase?.Longitud_Clean_Robo || -57.56;
    const zoomLevel = selectedCase ? 13 : 12;

    const map = L.map("trajectory-map", {
      center: [centerLat, centerLng],
      zoom: zoomLevel,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const casesToDraw = selectedCase ? [selectedCase] : cases.slice(0, 30);

    casesToDraw.forEach((c) => {
      const latRobo = c.Latitud_Clean_Robo || -38.01;
      const lngRobo = c.Longitud_Clean_Robo || -57.54;
      const latHall = c.Latitud_Clean_Hallazgo || -37.97;
      const lngHall = c.Longitud_Clean_Hallazgo || -57.59;

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
          <strong style="color: #dc2626;">🔴 PUNTO DE ROBO (911)</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal}<br/>
          <b>Marca:</b> ${c.Marca_Detectada}<br/>
          <b>Fecha:</b> ${c.Fecha_Robo}<br/>
          <b>Dirección:</b> ${c.Dirección_Robo}
        </div>
      `);
      roboMarker.addTo(map);

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
          <strong style="color: #059669;">🟢 PUNTO DE HALLAZGO / ABANDONO (911)</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal}<br/>
          <b>Marca:</b> ${c.Marca_Detectada}<br/>
          <b>Fecha:</b> ${c.Fecha_Hallazgo}<br/>
          <b>Dirección:</b> ${c.Dirección_Hallazgo}<br/>
          <b>Tiempo Transcurrido:</b> ${c.Horas_Hasta_Hallazgo} hs
        </div>
      `);
      hallazgoMarker.addTo(map);

      // Dashed Vector Polyline connecting Robo -> Hallazgo
      const polyline = L.polyline([[latRobo, lngRobo], [latHall, lngHall]], {
        color: c.SubTipo === "MOTOS" ? "#f59e0b" : "#6366f1",
        weight: 3,
        dashArray: "6, 6",
        opacity: 0.85,
      });

      polyline.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
          <strong>Vector de Trayectoria (${c.SubTipo})</strong><br/>
          <b>Patente:</b> ${c.Patente_Principal} (${c.Marca_Detectada})<br/>
          <b>Recuperado en:</b> ${c.Horas_Hasta_Hallazgo} horas<br/>
          <i>Desde: ${c.Dirección_Robo} ➔ Hasta: ${c.Dirección_Hallazgo}</i>
        </div>
      `);
      polyline.addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [L, selectedCase, cases]);

  return <div id="trajectory-map" style={{ width: "100%", height: "480px", borderRadius: "var(--radius-md)" }} />;
}

export default function SectionRecoveryTracker({ recoveries = [] }: SectionRecoveryTrackerProps) {
  const [vehicleType, setVehicleType] = useState<"todos" | "autos" | "motos">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);

  // Filter recoveries by vehicle type and search query
  const filteredCases = recoveries.filter((c) => {
    if (vehicleType === "autos" && c.SubTipo !== "VEHÍCULOS") return false;
    if (vehicleType === "motos" && c.SubTipo !== "MOTOS") return false;

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

  // Automatically select first case if none selected or filter changes
  useEffect(() => {
    if (filteredCases.length > 0 && (!selectedCase || !filteredCases.some((c) => c.ID_Robo === selectedCase.ID_Robo))) {
      setSelectedCase(filteredCases[0]);
    }
  }, [filteredCases]);

  const medianHours = vehicleType === "motos" ? 7.0 : vehicleType === "autos" ? 4.9 : 5.4;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.08) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-indigo)", color: "#fff" }}>
              <Car size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Trazabilidad & Seguimiento de Vehículos (Robo ➔ Hallazgo)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Auditoría cruzada de denuncias de sustracción y actas de hallazgo del 911 discriminadas por Motos y Autos.
              </p>
            </div>
          </div>

          {/* Vehicle Type Switcher Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", background: "var(--bg-base)", padding: "0.3rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setVehicleType("todos")}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                background: vehicleType === "todos" ? "var(--accent-indigo)" : "transparent",
                color: vehicleType === "todos" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Todos ({recoveries.length})
            </button>
            <button
              onClick={() => setVehicleType("autos")}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                background: vehicleType === "autos" ? "var(--accent-indigo)" : "transparent",
                color: vehicleType === "autos" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Car size={15} /> Automotores
            </button>
            <button
              onClick={() => setVehicleType("motos")}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "6px",
                border: "none",
                background: vehicleType === "motos" ? "var(--accent-amber)" : "transparent",
                color: vehicleType === "motos" ? "#fff" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Bike size={15} /> Motovehículos
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--accent-indigo)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Casos Trazados</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.3rem 0" }}>
            {filteredCases.length} Vehículos
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "autos" ? "64.9% Tasa de Hallazgo (Vehículo Apoyo)" : vehicleType === "motos" ? "19.7% Tasa de Hallazgo (Desguace Inmediato)" : "Cruce completo de patentes 911"}
          </span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--accent-amber)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Mediana Tiempo Recuperación</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--accent-amber)", margin: "0.3rem 0" }}>
            ⏱️ {medianHours} Horas
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "autos" ? "Autos: Abandono rápido tras huida" : vehicleType === "motos" ? "Motos: Enfriamiento o desarme previo" : "Mediana global: 5.4 horas"}
          </span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Patrón Dominante</span>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981", margin: "0.4rem 0" }}>
            {vehicleType === "motos" ? "🔧 Desguace & Scraping" : vehicleType === "autos" ? "🚗 Vehículo de Apoyo / Escape" : "🔀 Divergencia Auto vs Moto"}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            {vehicleType === "motos" ? "Motos son desarmadas en < 12hs" : "Autos son abandonados enteros"}
          </span>
        </div>
      </div>

      {/* Main Split View: Cases List + Trajectory Map */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Interactive Cases Selector List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Casos Cruzados ({filteredCases.length})
            </h3>

            {/* Search Input */}
            <div style={{ position: "relative", width: "200px" }}>
              <Search size={14} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Buscar patente o calle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "2rem", height: "34px", fontSize: "0.8rem", width: "100%" }}
              />
            </div>
          </div>

          {/* Cases Scrollable List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "420px", overflowY: "auto" }}>
            {filteredCases.map((c) => {
              const isSelected = selectedCase?.ID_Robo === c.ID_Robo;
              const hours = c.Horas_Hasta_Hallazgo;
              const isFast = hours < 6;

              return (
                <div
                  key={c.ID_Robo}
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
                      <span style={{ fontSize: "0.85rem", fontWeight: 800, fontFamily: "monospace", padding: "0.15rem 0.45rem", borderRadius: "4px", background: "rgba(16, 185, 129, 0.2)", color: "#6ee7b7" }}>
                        🏷️ {c.Patente_Principal}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {c.Marca_Detectada}
                      </span>
                    </div>

                    <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "4px", background: isFast ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)", color: isFast ? "#6ee7b7" : "#fde047" }}>
                      ⏱️ {hours}h hasta hallazgo
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={16} style={{ color: "var(--accent-indigo)" }} /> Vector Espacial de Trayectoria
            </h3>
            {selectedCase && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-amber)" }}>
                Vínculo: {selectedCase.Patente_Principal}
              </span>
            )}
          </div>

          <TrajectoryMap selectedCase={selectedCase} cases={filteredCases} />
        </div>
      </div>

      {/* Side-by-Side Relato Inspector Modal / Audit Panel */}
      {selectedCase && (
        <div className="card" style={{ borderLeft: "4px solid var(--accent-indigo)", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-indigo)" }}>
                Auditoría Comparativa de Relatos 911
              </span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.2rem 0 0", color: "var(--text-primary)" }}>
                Patente: {selectedCase.Patente_Principal} ({selectedCase.Marca_Detectada} - {selectedCase.SubTipo})
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-base)", padding: "0.4rem 0.8rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
              <Clock size={16} style={{ color: "var(--accent-amber)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Diferencial de Tiempo: {selectedCase.Horas_Hasta_Hallazgo} horas
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
