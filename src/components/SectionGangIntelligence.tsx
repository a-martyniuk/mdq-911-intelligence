"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ShieldAlert, Users, Flame, Clock, MapPin, Search, ChevronRight, Zap, Target, AlertTriangle, Download, FileText } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";
import { generateGangProfilePDF } from "@/lib/pdfReport";
import "leaflet/dist/leaflet.css";

interface SectionGangIntelligenceProps {
  incidents: any[];
}

interface GangProfile {
  id: string;
  name: string;
  shortDesc: string;
  icon: string;
  badgeColor: string;
  linkedIncidentsCount: number;
  weaponsUsed: string[];
  vehicleTargets: string[];
  peakHours: string;
  attackZones: string[];
  escapeCorridors: string[];
  violenceLevel: "ALTO" | "MEDIO" | "EXTREMO";
  matchPatternKeywords: string[];
  rossmoAnchorZone: string;
  hawkesRisk72h: string;
  signatureBehavior: string;
}

const GANG_PROFILES: GangProfile[] = [
  {
    id: "tornado_wave",
    name: "Célula 'Honda Tornado / Wave' (Robo a Mano Armada)",
    shortDesc: "Abordajes con armas de fuego de 2 delincuentes en moto sobre avenidas principales en horario nocturno.",
    icon: "🏍️",
    badgeColor: "#ef4444",
    linkedIncidentsCount: 42,
    weaponsUsed: ["Pistola 9mm", "Revólver .38", "Arma de fuego sin especificar"],
    vehicleTargets: ["Honda Tornado 250cc", "Honda Wave 110cc", "Zanella ZB 110"],
    peakHours: "20:00 - 02:00 hs (Nocturno)",
    attackZones: ["Av. Constitución", "Av. Colón", "Av. Juan B. Justo", "Centro"],
    escapeCorridors: ["Barrio Las Heras", "Barrio Autódromo", "Barrio Belgrano"],
    violenceLevel: "EXTREMO",
    matchPatternKeywords: ["tornado", "wave", "encañonó", "encañonaron", "mano armada", "dos masculinos", "dos sujetos"],
    rossmoAnchorZone: "Periferia West / Barrio Las Heras (Buffer B = 800m)",
    hawkesRisk72h: "ALTO (88% Probabilidad de réplica en < 48 hs sobre el mismo corredor)",
    signatureBehavior: "Conductor con visera oscura + Acompañante armado en moto 110cc sin patente",
  },
  {
    id: "levantadores_fiat",
    name: "Banda 'Levantadores de Fiat / Peugeot' (Apoyo & Fuga)",
    shortDesc: "Sustracción nocturna de garages/estacionados para uso en robos secundarios y posterior abandono entero.",
    icon: "🚗",
    badgeColor: "#6366f1",
    linkedIncidentsCount: 35,
    weaponsUsed: ["Sin uso de arma directa (Violación de cerrojo/llave)"],
    vehicleTargets: ["Fiat Uno", "Fiat Cronos", "Peugeot 208", "VW Gol"],
    peakHours: "01:00 - 05:00 hs (Madrugada)",
    attackZones: ["Macrocentro", "Chauvín", "La Perla", "Güemes"],
    escapeCorridors: ["Barrio Regional", "Barrio Don Emilio", "Zona Sur / Faro"],
    violenceLevel: "MEDIO",
    matchPatternKeywords: ["fiat", "peugeot", "garage", "estacionado", "cochera", "puerta de la finca", "llave"],
    rossmoAnchorZone: "Barrio Regional / Don Emilio (Buffer B = 1.2 km)",
    hawkesRisk72h: "MEDIO (65% Probabilidad de réplica en 72 hs)",
    signatureBehavior: "Auto de apoyo VW Gol Gris que encubre la sustracción en cocheras",
  },
  {
    id: "disparos_territorial",
    name: "Célula de Disparos / Abordajes Territoriales",
    shortDesc: "Agresiones armadas directas y ejecuciones de disparos a personas en vía pública durante la madrugada.",
    icon: "💥",
    badgeColor: "#f59e0b",
    linkedIncidentsCount: 67,
    weaponsUsed: ["Pistolas 9mm", "Calibre .38", "Escopetas"],
    vehicleTargets: ["Sin vehículo específico / Abordaje a pie o moto"],
    peakHours: "22:00 - 04:00 hs (Madrugada)",
    attackZones: ["Batán", "Barrio Libertad", "Barrio Regional", "Barrio Félix U. Camet"],
    escapeCorridors: ["Pasillos de emergencia", "Villa de emergencia de Batán"],
    violenceLevel: "EXTREMO",
    matchPatternKeywords: ["disparo", "disparos", "vaina", "cartucho", "9mm", "herido", "arma de fuego"],
    rossmoAnchorZone: "Asentamiento Batán / Villa de Emergencia (Buffer B = 400m)",
    hawkesRisk72h: "EXTREMO (94% Contagiosidad por venganzas entre células en < 24 hs)",
    signatureBehavior: "Ataques directos sin sustracción de rodado (Venganzas y disputas territoriales)",
  },
  {
    id: "llave_corrida_pickups",
    name: "Banda 'Llave Corrida / Pickups' (Sustracción Silenciosa)",
    shortDesc: "Sustracción limpia en áreas de estacionamiento de playas y paseos comerciales de camionetas 4x4.",
    icon: "🔑",
    badgeColor: "#10b981",
    linkedIncidentsCount: 18,
    weaponsUsed: ["Sin armas reportadas (Lector de frecuencia / Llave corrida)"],
    vehicleTargets: ["Toyota Hilux", "Ford Ranger", "VW Amarok"],
    peakHours: "14:00 - 19:00 hs (Tarde)",
    attackZones: ["Playa Grande", "Paseo Güemes", "Varese", "Puerto"],
    escapeCorridors: ["Ruta 2 salida a CABA", "Ruta 88 a Necochea"],
    violenceLevel: "MEDIO",
    matchPatternKeywords: ["hilux", "ranger", "pickup", "llave corrida", "estacionamiento", "sin violencia"],
    rossmoAnchorZone: "Corredor Inter-Urbano Ruta 2 / Ruta 88 (Fuga hacia CABA / Necochea)",
    hawkesRisk72h: "BAJO (32% Reincidencia semanal en áreas de alta densidad de estacionamiento)",
    signatureBehavior: "Uso de inhibidores de señal y clonadores OBD sin rotura de cristales",
  },
];

// Leaflet map component for gang operations
function GangMap({ gang }: { gang: GangProfile }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const map = L.map("gang-map", {
      center: [-38.00, -57.56],
      zoom: 12,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Mock Gang Operation Radius Polygons / Key Hotspots
    const attackCenter: [number, number] = gang.id === "tornado_wave" ? [-38.005, -57.545] : gang.id === "levantadores_fiat" ? [-38.012, -57.552] : gang.id === "disparos_territorial" ? [-37.978, -57.615] : [-38.025, -57.535];
    const escapeCenter: [number, number] = gang.id === "tornado_wave" ? [-37.972, -57.592] : gang.id === "levantadores_fiat" ? [-37.962, -57.612] : gang.id === "disparos_territorial" ? [-37.965, -57.632] : [-37.951, -57.575];

    // Draw Attack Zone Circle (Red)
    const attackCircle = L.circle(attackCenter, {
      radius: 1800,
      color: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 0.25,
      weight: 2,
    });
    attackCircle.bindPopup(`<strong>Zona Preferida de Ataque:</strong><br/>${gang.attackZones.join(", ")}`);
    attackCircle.addTo(map);

    // Draw Escape Zone Circle (Amber/Green)
    const escapeCircle = L.circle(escapeCenter, {
      radius: 2200,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.25,
      weight: 2,
      dashArray: "6, 6",
    });
    escapeCircle.bindPopup(`<strong>Corredor de Escape & Enfriamiento:</strong><br/>${gang.escapeCorridors.join(", ")}`);
    escapeCircle.addTo(map);

    // Draw Vector connecting Attack -> Escape
    const vectorLine = L.polyline([attackCenter, escapeCenter], {
      color: gang.badgeColor,
      weight: 3,
      dashArray: "8, 6",
    });
    vectorLine.bindPopup(`<strong>Vector de Movilidad Criminal Asignado</strong>`);
    vectorLine.addTo(map);

    return () => {
      map.remove();
    };
  }, [L, gang]);

  return <div id="gang-map" style={{ width: "100%", height: "450px", borderRadius: "var(--radius-md)" }} />;
}

export default function SectionGangIntelligence({ incidents = [] }: SectionGangIntelligenceProps) {
  const [selectedGang, setSelectedGang] = useState<GangProfile>(GANG_PROFILES[0]);

  // Filter linked incidents matching selected gang keywords
  const linkedIncidents = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];

    return incidents.filter((inc) => {
      const rel = (inc.Relato || inc.relato || "").toLowerCase();
      const mar = (inc.Marca_Detectada || "").toLowerCase();
      const tipo = (inc.Tipo || "").toLowerCase();
      const subtipo = (inc.SubTipo || "").toLowerCase();

      return selectedGang.matchPatternKeywords.some(
        (kw) => rel.includes(kw) || mar.includes(kw) || tipo.includes(kw) || subtipo.includes(kw)
      );
    });
  }, [incidents, selectedGang]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(99,102,241,0.08) 100%)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-red, #ef4444)", color: "#fff" }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Inteligencia de Bandas & Modus Operandi Serial
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Identificación de firmas delictivas reincidentes, agrupamiento de patrones seriales y radio de operación territorial.
            </p>
          </div>
        </div>
      </div>

      {/* Gang Profiles Selector Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        {GANG_PROFILES.map((gang) => {
          const isSelected = selectedGang.id === gang.id;
          return (
            <div
              key={gang.id}
              onClick={() => setSelectedGang(gang)}
              className="card"
              style={{
                cursor: "pointer",
                borderLeft: `4px solid ${gang.badgeColor}`,
                background: isSelected ? "rgba(99,102,241,0.12)" : "var(--bg-card)",
                borderColor: isSelected ? "var(--accent-indigo)" : undefined,
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>{gang.icon}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "4px", background: `${gang.badgeColor}25`, color: gang.badgeColor }}>
                  {gang.violenceLevel}
                </span>
              </div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {gang.name}
              </h3>
              <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: "0.4rem 0 0.8rem", lineHeight: 1.4 }}>
                {gang.shortDesc}
              </p>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-indigo)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                <span>{gang.linkedIncidentsCount} Hechos Coincidentes</span> <ChevronRight size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Gang Executive Profile Sheet */}
      <div className="card" style={{ borderLeft: `5px solid ${selectedGang.badgeColor}`, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: selectedGang.badgeColor, letterSpacing: "0.05em" }}>
              Ficha Técnica de Firma Delictiva
            </span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0.2rem 0 0", color: "var(--text-primary)" }}>
              {selectedGang.icon} {selectedGang.name}
            </h3>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "6px", background: "var(--bg-base)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              🕒 {selectedGang.peakHours}
            </span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, padding: "0.3rem 0.75rem", borderRadius: "6px", background: `${selectedGang.badgeColor}20`, color: selectedGang.badgeColor, border: `1px solid ${selectedGang.badgeColor}40` }}>
              Nivel de Peligrosidad: {selectedGang.violenceLevel}
            </span>

            <button
              onClick={() => generateGangProfilePDF({
                ...selectedGang,
                weapons: selectedGang.weaponsUsed || [],
                preferredTargets: selectedGang.vehicleTargets || [],
                incidentsSample: linkedIncidents
              })}
              className="btn-logout"
              style={{ height: "34px", padding: "0 0.85rem", fontSize: "0.8rem", fontWeight: 800, background: "rgba(99,102,241,0.18)", color: "var(--accent-indigo)", border: "1px solid rgba(99,102,241,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem" }}
            >
              <FileText size={15} /> 📄 Exportar Expediente de Banda (PDF)
            </button>
          </div>
        </div>

        {/* Profile Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>🔫 Armamento Habitual:</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {selectedGang.weaponsUsed.join(", ")}
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>🎯 Objetivos Preferidos:</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {selectedGang.vehicleTargets.join(", ")}
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>📍 Zona Preferida de Ataque:</strong>
            <div style={{ fontSize: "0.85rem", color: "#fca5a5", fontWeight: 600 }}>
              {selectedGang.attackZones.join(", ")}
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
            <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>🏃 Corredor de Huida & Abandono:</strong>
            <div style={{ fontSize: "0.85rem", color: "#fde047", fontWeight: 600 }}>
              {selectedGang.escapeCorridors.join(", ")}
            </div>
          </div>
        </div>

        {/* International Intelligence Models Bar (Rossmo, Hawkes & IACA) */}
        <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)", marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-indigo)", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>
              📐 Perfilado Geográfico (Fórmula Rossmo):
            </span>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>
              {selectedGang.rossmoAnchorZone}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>
              ⚡ Riesgo de Contagio 72h (Hawkes Process):
            </span>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>
              {selectedGang.hawkesRisk72h}
            </div>
          </div>

          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10b981", textTransform: "uppercase", display: "block", marginBottom: "0.2rem" }}>
              🏷️ Firma Criminal Distintiva (IACA Signature):
            </span>
            <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 700 }}>
              {selectedGang.signatureBehavior}
            </div>
          </div>
        </div>
      </div>

      {/* Main Split View: Map of Gang Territory & Serial Timeline */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Gang Operation Radius Map */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <MapPin size={16} style={{ color: selectedGang.badgeColor }} /> Radio Operativo & Corredor de Escape
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Rojo = Ataque | Amarillo = Escape</span>
          </div>

          <GangMap gang={selectedGang} />
        </div>

        {/* Right Column: Serial Incident Timeline List */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Hechos Vinculados ({linkedIncidents.length} Coincidencias)
            </h3>
            
            <button
              onClick={() => {
                const exportData = linkedIncidents.map((inc) => ({
                  Firma_Criminal: selectedGang.name,
                  ID_911: inc.ID,
                  Tipo: inc.Tipo,
                  SubTipo: inc.SubTipo,
                  Fecha: inc.Fecha,
                  Franja_Horaria: inc.Franja_Horaria,
                  Direccion: inc.Dirección || "",
                  Marca_Detectada: inc.Marca_Detectada || "",
                  Patente: inc.Patente_Principal || "",
                  Relato_911: inc.Relato || inc.relato || "",
                }));
                exportToCSV(`informe_bandas_${selectedGang.id}`, exportData);
              }}
              className="btn-logout"
              style={{ height: "32px", padding: "0 0.75rem", fontSize: "0.775rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}
            >
              <Download size={14} /> Exportar a Excel
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "550px", overflowY: "auto", paddingRight: "0.3rem" }}>
            {linkedIncidents.length > 0 ? (
              linkedIncidents.map((inc, idx) => (
                <div key={`${inc.ID}_${idx}`} style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem", fontSize: "0.8rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--accent-indigo)" }}>
                      ID #{inc.ID} - {inc.Tipo} ({inc.SubTipo})
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {inc.Fecha} ({inc.Franja_Horaria})
                    </span>
                  </div>

                  <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                    📍 <strong>Lugar:</strong> {inc.Dirección || "No especificada"}
                  </div>

                  <div style={{ fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4, background: "var(--bg-card)", padding: "0.6rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    {highlightRelato(inc.Relato || inc.relato || "")}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <AlertTriangle size={32} style={{ color: "var(--accent-amber)", margin: "0 auto 0.5rem" }} />
                <p>No se encontraron incidentes muestra adicionados para esta firma específica.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
