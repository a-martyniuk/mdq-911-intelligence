"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Car, Skull, Crosshair } from "lucide-react";
import Sidebar from "./Sidebar";
import IntroBanner from "./IntroBanner";
import SectionOverview from "./SectionOverview";
import SectionMap from "./SectionMap";
import SectionHotspots from "./SectionHotspots";
import SectionTemporal from "./SectionTemporal";
import SectionVehicles from "./SectionVehicles";
import SectionNLP from "./SectionNLP";
import SectionInvestigativeValue from "./SectionInvestigativeValue";
import SectionGraph from "./SectionGraph";
import SectionSearch from "./SectionSearch";
import SectionRecoveryTracker from "./SectionRecoveryTracker";
import SectionGangIntelligence from "./SectionGangIntelligence";
import SectionJurisdictions from "./SectionJurisdictions";
import SectionETL from "./SectionETL";
import SectionDictionary from "./SectionDictionary";

// José C. Paz Sections
import SectionDrogasOverview from "./SectionDrogasOverview";
import SectionDrogasMap from "./SectionDrogasMap";
import SectionDrogasNLP from "./SectionDrogasNLP";
import SectionDrogasHotspots from "./SectionDrogasHotspots";
import SectionDrogasSearch from "./SectionDrogasSearch";
import SectionDrogasGraph from "./SectionDrogasGraph";
import SectionDrogasTemporal from "./SectionDrogasTemporal";
import SectionDrogasETL from "./SectionDrogasETL";

// Malvinas Argentinas Sections
import SectionMalvinasOverview from "./SectionMalvinasOverview";
import SectionMalvinasMap from "./SectionMalvinasMap";
import SectionMalvinasNLP from "./SectionMalvinasNLP";
import SectionMalvinasHotspots from "./SectionMalvinasHotspots";
import SectionMalvinasSearch from "./SectionMalvinasSearch";
import SectionMalvinasGraph from "./SectionMalvinasGraph";
import SectionMalvinasTemporal from "./SectionMalvinasTemporal";
import SectionMalvinasETL from "./SectionMalvinasETL";

import { FilterState } from "@/lib/types";
import { getApiUrl, getAppPath, getAssetPath } from "@/lib/apiUrl";

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<"mdp" | "jcp" | "malvinas">("mdp");
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [user, setUser] = useState<string>("admin");
  const router = useRouter();

  const [filters, setFilters] = useState<FilterState>({
    tipo: "todos",
    subtipo: "todos",
    franjaHoraria: "todos",
    diaSemana: "todos",
    origenDataset: "todos",
  });

  // Keep active section in sync with active project
  useEffect(() => {
    if (currentProject === "jcp" && !activeSection.startsWith("drogas-")) {
      setActiveSection("drogas-overview");
    } else if (currentProject === "malvinas" && !activeSection.startsWith("malvinas-")) {
      setActiveSection("malvinas-overview");
    } else if (currentProject === "mdp" && (activeSection.startsWith("drogas-") || activeSection.startsWith("malvinas-"))) {
      setActiveSection("overview");
    }
  }, [currentProject, activeSection]);

  // Verify auth session on load
  useEffect(() => {
    fetch(getApiUrl("/api/auth/session"))
      .then((res) => res.json())
      .then((sess) => {
        if (!sess.authenticated) {
          window.location.href = getAppPath("/login");
        } else {
          setUser(sess.user || "admin");
        }
      })
      .catch(() => {
        window.location.href = getAppPath("/login");
      });
  }, []);

  // Fetch dataset according to active project & filters
  useEffect(() => {
    setLoading(true);
    setData(null); // Limpiar datos de la jurisdicción anterior para evitar mezcla de coordenadas
    const query = new URLSearchParams();
    query.set("project", currentProject);

    if (currentProject === "mdp") {
      if (filters.tipo !== "todos") query.set("tipo", filters.tipo);
      if (filters.subtipo !== "todos") query.set("subtipo", filters.subtipo);
      if (filters.franjaHoraria !== "todos") query.set("franjaHoraria", filters.franjaHoraria);
      if (filters.diaSemana !== "todos") query.set("diaSemana", filters.diaSemana);
      if (filters.origenDataset !== "todos") query.set("origenDataset", filters.origenDataset);
    }

    let isSubscribed = true;
    fetch(getApiUrl(`/api/data/incidents?${query.toString()}`))
      .then((res) => {
        if (res.status === 401) {
          window.location.href = getAppPath("/login");
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (isSubscribed && d) {
          if (!d.project || d.project === currentProject) {
            setData(d);
          }
        }
      })
      .catch((err) => console.error("Error loading data:", err))
      .finally(() => {
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [currentProject, filters]);

  const handleLogout = async () => {
    await fetch(getApiUrl("/api/auth/logout"), { method: "POST" });
    window.location.href = getAppPath("/login");
  };

  const availableTipos = ["ROBO AUTOMOTOR", "DISPAROS", "VIOLENCIA", "DROGAS ILÍCITAS", "HALLAZGO", "SOSPECHOSOS"];
  const availableSubtipos = ["MOTOS", "VEHÍCULOS", "PERSONAS", "NO FAMILIAR", "VEHICULAR", "DISPAROS", "VENTA/ELABORACIÓN"];

  if (loading && !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-indigo)", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Cargando Plataforma de Investigación MSEG...</p>
        </div>
      </div>
    );
  }

  // MDP Stats
  const mdpStats = {
    totalIncidents: data?.totalIncidents || 8598,
    georeferencedCount: data?.georeferencedCount || 8035,
    georeferencedPct: data?.georeferencedPct || 93.5,
    nightCount: data?.nightCount || 3397,
    nightPct: data?.nightPct || 39.5,
    recoveriesCount: data?.recoveries ? new Set(data.recoveries.map((r: any) => r.ID_Robo)).size : 58,
    medianRecoveryHours: 5.4,
  };

  // JCP Stats
  const jcpStats = {
    totalIncidents: data?.totalIncidents || 1770,
    georeferencedCount: data?.georeferencedCount || 1763,
    georeferencedPct: data?.georeferencedPct || 99.6,
    armasCount: data?.armasCount || 1369,
    armasPct: data?.armasPct || 77.3,
    cocainaCount: data?.cocainaCount || 717,
    marihuanaCount: data?.marihuanaCount || 323,
    pacoCount: data?.pacoCount || 50,
  };

  // Malvinas Stats
  const malvinasStats = {
    totalIncidents: data?.totalIncidents || 1471,
    georeferencedCount: data?.georeferencedCount || 1451,
    georeferencedPct: data?.georeferencedPct || 98.6,
    armasCount: data?.armasCount || 1059,
    armasPct: data?.armasPct || 72.0,
    cocainaCount: data?.cocainaCount || 546,
    marihuanaCount: data?.marihuanaCount || 252,
    pacoCount: data?.pacoCount || 39,
  };

  return (
    <div className="app-layout">
      {/* Institutional Tactical Status Bar */}
      <div className="tactical-statusbar">
        <div className="status-left">
          <span className="status-live">SISTEMA 911 OPERATIVO</span>
          <span>//</span>
          <span>MINISTERIO DE SEGURIDAD PBA · SUBSECRETARÍA DE INTELIGENCIA CRIMINAL</span>
        </div>
        <div className="status-right">
          <span className="font-mono">DATUM: WGS-84 / EPSG:4326</span>
          <span>//</span>
          <span className="font-mono">AUDITORÍA FORENSE: LEY 13.482</span>
          <span>//</span>
          <span className="font-mono" style={{ color: "var(--accent-pba-cyan)" }}>TERMINAL: CR-911-PROV</span>
        </div>
      </div>

      {/* Header */}
      <header className="app-header">
        <div className="header-brand" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--bg-elevated)", padding: "4px 8px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <img
              src={getAssetPath("/images/institucional/logo_ministerio.svg")}
              alt="Ministerio de Seguridad PBA"
              style={{ height: "30px", width: "auto", objectFit: "contain" }}
            />
            <div style={{ width: "1px", height: "22px", background: "var(--border)" }} />
            <img
              src={getAssetPath("/images/institucional/logo_superintendencia.png")}
              alt="Superintendencia de Investigaciones"
              style={{ height: "30px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
              <h1 className="brand-title" style={{ margin: 0, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
                Superintendencia de Investigaciones de Delitos Complejos
              </h1>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                // GOBIERNO PBA
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-display)", fontWeight: 700 }}>
                Jurisdicción Activa:
              </span>
              {currentProject === "mdp" ? (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(13, 92, 168, 0.2)", color: "#38bdf8", border: "1px solid rgba(0, 163, 224, 0.4)", padding: "1px 7px", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <Car size={12} /> MAR DEL PLATA [Automotores & Delito Calificado]
                </span>
              ) : currentProject === "jcp" ? (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.4)", padding: "1px 7px", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <Skull size={12} /> JOSÉ C. PAZ [Narcocriminalidad & Búnkers]
                </span>
              ) : (
                <span style={{ fontSize: "0.72rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", border: "1px solid rgba(245, 158, 11, 0.4)", padding: "1px 7px", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <Crosshair size={12} /> MALVINAS ARGENTINAS [Narcocriminalidad & Puntos de Venta]
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="header-user" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {currentProject === "mdp" && (
            <button
              onClick={() => {
                import("@/lib/pdfReport").then((mod) => {
                  mod.generateExecutiveDossierPDF({
                    totalIncidents: mdpStats.totalIncidents,
                    incidentsSample: data?.incidentsSample || data?.geoPoints || [],
                    recoveries: data?.recoveries || [],
                    gangs: [
                      { nombre: "Banda de la Moto Negra 110cc", hechosCount: 24, patron: "Conductor con visera y acompañante armado en moto 110cc sin patente", franja: "Noche (20 a 02 hs)", zona: "Comisaría 2da (Macrocentro)", explicacion: "Coincidencia de 24 despachos en 30 días." },
                      { nombre: "Célula Fuga VW Gol Gris", hechosCount: 18, patron: "Auto de apoyo Gol Gris en robos de motocicletas", franja: "Madrugada (01 a 06 hs)", zona: "Comisaría 4ta (Pompeya)", explicacion: "Escape en convoy detectado por cámaras 911." },
                      { nombre: "Grupo Desguace Periferia West", hechosCount: 15, patron: "Sustracción en Centro ➔ Desguace en < 6 hs en Batán/Las Heras", franja: "Tarde/Noche", zona: "Comisaría 8va y 11ra", explicacion: "Recuperaciones de chasis desarmados." }
                    ]
                  });
                });
              }}
              style={{
                height: "34px",
                padding: "0 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.03em",
                background: "var(--accent-pba-blue)",
                color: "#fff",
                border: "1px solid var(--accent-pba-cyan)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              📄 Dossier MDP (PDF)
            </button>
          )}

          {currentProject === "jcp" && (
            <button
              onClick={() => {
                import("@/lib/pdfReport").then((mod) => {
                  const rawIncidents = data?.project === "jcp" ? (data?.incidents || data?.geoPoints || []) : [];
                  const jcpIncidents = rawIncidents.filter((i: any) => {
                    const p = (i.partido || "").toUpperCase();
                    return !p.includes("MALVINAS") && !p.includes("GENERAL PUEYRREDON") && !p.includes("MDP");
                  });
                  mod.generateDrogasJcpPDF({
                    totalIncidents: jcpStats.totalIncidents,
                    georeferencedCount: jcpStats.georeferencedCount,
                    armasCount: jcpStats.armasCount,
                    cocainaCount: jcpStats.cocainaCount,
                    marihuanaCount: jcpStats.marihuanaCount,
                    pacoCount: jcpStats.pacoCount,
                    incidents: jcpIncidents,
                  });
                });
              }}
              style={{
                height: "34px",
                padding: "0 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.03em",
                background: "#991b1b",
                color: "#fff",
                border: "1px solid var(--accent-red)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              📄 Dossier Drogas JCP (PDF)
            </button>
          )}

          {currentProject === "malvinas" && (
            <button
              onClick={() => {
                import("@/lib/pdfReport").then((mod) => {
                  const rawIncidents = data?.project === "malvinas" ? (data?.incidents || data?.geoPoints || []) : [];
                  const malvinasIncidents = rawIncidents.filter((i: any) => {
                    const p = (i.partido || "").toUpperCase();
                    if (p.includes("JOSÉ") || p.includes("JOSE") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;
                    const lat = Number(i.lat ?? i.Latitud_Clean ?? i.Latitud);
                    if (!isNaN(lat) && lat < -34.535) return false;
                    return true;
                  });
                  mod.generateDrogasMalvinasPDF({
                    totalIncidents: malvinasStats.totalIncidents,
                    georeferencedCount: malvinasStats.georeferencedCount,
                    armasCount: malvinasStats.armasCount,
                    cocainaCount: malvinasStats.cocainaCount,
                    marihuanaCount: malvinasStats.marihuanaCount,
                    pacoCount: malvinasStats.pacoCount,
                    incidents: malvinasIncidents,
                  });
                });
              }}
              style={{
                height: "34px",
                padding: "0 0.85rem",
                fontSize: "0.78rem",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.03em",
                background: "#92400e",
                color: "#fff",
                border: "1px solid var(--accent-amber)",
                borderRadius: "var(--radius-md)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              📄 Dossier Drogas Malvinas (PDF)
            </button>
          )}

          <div className="user-badge">
            <span className="user-dot"></span>
            <span style={{ fontFamily: "var(--font-mono)" }}>OPERADOR: {user.toUpperCase()}</span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Sidebar with Project Switcher */}
      <Sidebar
        currentProject={currentProject}
        setCurrentProject={setCurrentProject}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        filters={filters}
        setFilters={setFilters}
        availableTipos={availableTipos}
        availableSubtipos={availableSubtipos}
      />

      {/* Main Content Area */}
      <main className="app-main">
        <IntroBanner currentProject={currentProject} />

        {/* ======================================= */}
        {/* PROYECTO 1: MAR DEL PLATA               */}
        {/* ======================================= */}
        {currentProject === "mdp" && (
          <>
            {activeSection === "overview" && (
              <SectionOverview
                stats={mdpStats}
                incidents={data?.incidents || data?.incidentsSample || data?.geoPoints || []}
                recoveries={data?.recoveries || []}
              />
            )}
            {activeSection === "map" && <SectionMap geoPoints={data?.geoPoints || []} recoveries={data?.recoveries || []} />}
            {activeSection === "recovery-tracker" && <SectionRecoveryTracker recoveries={data?.recoveries || []} />}
            {activeSection === "gang-intelligence" && <SectionGangIntelligence incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "jurisdictions" && <SectionJurisdictions incidents={data?.incidents || data?.incidentsSample || []} recoveries={data?.recoveries || []} />}
            {activeSection === "graph" && <SectionGraph incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "search" && <SectionSearch incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "hotspots" && <SectionHotspots incidents={data?.incidents || data?.incidentsSample || []} geoPoints={data?.geoPoints || []} />}
            {activeSection === "temporal" && <SectionTemporal incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "vehicles" && <SectionVehicles recoveries={data?.recoveries || []} />}
            {activeSection === "nlp" && <SectionNLP />}
            {activeSection === "investigative" && <SectionInvestigativeValue />}
            {activeSection === "etl" && <SectionETL />}
            {activeSection === "dictionary" && <SectionDictionary />}
          </>
        )}

        {/* ======================================= */}
        {/* PROYECTO 2: JOSÉ C. PAZ (DROGAS)       */}
        {/* ======================================= */}
        {currentProject === "jcp" && (
          <>
            {activeSection === "drogas-overview" && <SectionDrogasOverview stats={jcpStats} incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-map" && <SectionDrogasMap incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-temporal" && <SectionDrogasTemporal incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-nlp" && <SectionDrogasNLP incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-graph" && <SectionDrogasGraph incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-hotspots" && <SectionDrogasHotspots incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-search" && <SectionDrogasSearch incidents={data?.incidents || []} />}
            {activeSection === "drogas-etl" && <SectionDrogasETL incidents={data?.incidents || data?.geoPoints || []} stats={jcpStats} />}
          </>
        )}

        {/* ======================================= */}
        {/* PROYECTO 3: MALVINAS ARGENTINAS (DROGAS) */}
        {/* ======================================= */}
        {currentProject === "malvinas" && (
          <>
            {activeSection === "malvinas-overview" && <SectionMalvinasOverview stats={malvinasStats} incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-map" && <SectionMalvinasMap incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-temporal" && <SectionMalvinasTemporal incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-nlp" && <SectionMalvinasNLP incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-graph" && <SectionMalvinasGraph incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-hotspots" && <SectionMalvinasHotspots incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "malvinas-search" && <SectionMalvinasSearch incidents={data?.incidents || []} />}
            {activeSection === "malvinas-etl" && <SectionMalvinasETL incidents={data?.incidents || data?.geoPoints || []} stats={malvinasStats} />}
          </>
        )}
      </main>

      {/* Footer Institucional Oficial */}
      <footer style={{
        margin: "2rem 1.5rem 1rem 1.5rem",
        padding: "1.25rem 1.75rem",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "12px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1.5rem",
        fontSize: "0.8rem",
        color: "var(--text-muted)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255, 255, 255, 0.05)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <img src={getAssetPath("/images/institucional/logo_ministerio.svg")} alt="Ministerio de Seguridad PBA" style={{ height: "36px", width: "auto" }} />
            <div style={{ width: "1px", height: "28px", background: "rgba(255, 255, 255, 0.2)" }} />
            <img src={getAssetPath("/images/institucional/logo_superintendencia.png")} alt="Superintendencia de Investigaciones" style={{ height: "36px", width: "auto" }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "0.85rem" }}>
              Ministerio de Seguridad de la Provincia de Buenos Aires
            </div>
            <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: "0.8rem", marginTop: "1px" }}>
              Superintendencia de Investigaciones de Delitos Complejos y Crimen Organizado
            </div>
            <div style={{ fontSize: "0.74rem", marginTop: "3px", color: "var(--text-secondary)" }}>
              📍 Avenida 52 S/N entre 117 y 118 – Paseo del Bosque de La Plata (C.P. N° 1900) · 📞 (0221) 423-1867/186
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", fontSize: "0.75rem", lineHeight: 1.45 }}>
          <div style={{ fontWeight: 800, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
            Sistema Integrado de Geointeligencia & Análisis Criminal 911
          </div>
          <div style={{ color: "var(--text-muted)" }}>
            Documento y Plataforma de Carácter Reservado · Ley Provincial N° 13.482
          </div>
          <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "2px" }}>
            Apoyo Técnico Operacional y Pericial a Unidades Fiscales de Instrucción
          </div>
        </div>
      </footer>
    </div>
  );
}
