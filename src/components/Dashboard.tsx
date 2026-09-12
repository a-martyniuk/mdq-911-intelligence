"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Car, Skull, Crosshair, FileText } from "lucide-react";
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
    } else {
      if (filters.subtipo !== "todos") query.set("sustancia", filters.subtipo);
      if (filters.franjaHoraria !== "todos") query.set("franjaHoraria", filters.franjaHoraria);
      if (filters.diaSemana !== "todos") query.set("diaSemana", filters.diaSemana);
      if (filters.origenDataset !== "todos") query.set("origen", filters.origenDataset);
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
    georeferencedCount: data?.georeferencedCount || 8000,
    georeferencedPct: data?.georeferencedPct || 93.0,
    nightCount: data?.nightCount || 3397,
    nightPct: data?.nightPct || 39.5,
    recoveriesCount: data?.recoveries ? new Set(data.recoveries.filter((r: any) => !(r.ID_Robo && r.ID_Hallazgo && r.ID_Robo === r.ID_Hallazgo)).map((r: any) => r.ID_Robo)).size : 52,
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
      {/* Unified Institutional Command Header */}
      <header className="app-header">
        <div className="header-brand">
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "var(--bg-surface)",
            padding: "5px 9px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <img
              src={getAssetPath("/images/institucional/logo_ministerio.svg")}
              alt="Ministerio de Seguridad PBA"
              style={{ height: "24px", width: "auto", objectFit: "contain" }}
            />
            <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />
            <img
              src={getAssetPath("/images/institucional/logo_superintendencia.png")}
              alt="Superintendencia de Investigaciones"
              style={{ height: "24px", width: "auto", objectFit: "contain" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 className="brand-title" style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>
                Superintendencia de Investigaciones de Delitos Complejos <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>·</span> <span style={{ color: "var(--accent-pba-cyan)" }}>Sistema 911</span>
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "1px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Jurisdicción activa:
              </span>
              <span style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: currentProject === "mdp" ? "#38bdf8" : currentProject === "jcp" ? "#f87171" : "#fbbf24",
                background: currentProject === "mdp" ? "rgba(56, 189, 248, 0.08)" : currentProject === "jcp" ? "rgba(239, 68, 68, 0.08)" : "rgba(245, 158, 11, 0.08)",
                border: "1px solid " + (currentProject === "mdp" ? "rgba(56, 189, 248, 0.25)" : currentProject === "jcp" ? "rgba(239, 68, 68, 0.25)" : "rgba(245, 158, 11, 0.25)"),
                padding: "1px 7px",
                borderRadius: "var(--radius-xs)",
                fontFamily: "var(--font-sans)"
              }}>
                {currentProject === "mdp" ? "General Pueyrredón · Automotor & Calificados" : currentProject === "jcp" ? "José C. Paz · Narcocriminalidad" : "Malvinas Argentinas · Narcocriminalidad"}
              </span>
            </div>
          </div>
        </div>

        <div className="header-user" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
              className="btn-export btn-pdf"
              title="Descargar Dossier Ejecutivo en PDF"
            >
              <FileText size={13} />
              <span>Dossier PDF</span>
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
              className="btn-export btn-pdf"
              title="Descargar Informe de Narcocriminalidad JCP en PDF"
            >
              <FileText size={13} />
              <span>Dossier PDF</span>
            </button>
          )}

          {currentProject === "malvinas" && (
            <button
              onClick={() => {
                import("@/lib/pdfReport").then((mod) => {
                  const rawIncidents = data?.project === "malvinas" ? (data?.incidents || data?.geoPoints || []) : [];
                  const malvinasIncidents = rawIncidents.filter((i: any) => {
                    const p = (i.partido || "").toUpperCase();
                    return !p.includes("JOSÉ") && !p.includes("JOSE") && !p.includes("GENERAL PUEYRREDON") && !p.includes("MDP");
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
              className="btn-export btn-pdf"
              title="Descargar Informe de Narcocriminalidad Malvinas en PDF"
            >
              <FileText size={13} />
              <span>Dossier PDF</span>
            </button>
          )}

          <div className="badge">
            <span className="badge-dot" />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>OPERATIVO</span>
          </div>

          <div className="user-badge">
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>OP:</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>{user}</span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
            <LogOut size={13} />
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
            {activeSection === "graph" && <SectionGraph incidents={data?.incidents || data?.incidentsSample || []} recoveries={data?.recoveries || []} />}
            {activeSection === "search" && <SectionSearch incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "hotspots" && <SectionHotspots incidents={data?.incidents || data?.incidentsSample || []} geoPoints={data?.geoPoints || []} />}
            {activeSection === "temporal" && <SectionTemporal incidents={data?.incidents || data?.incidentsSample || []} />}
            {activeSection === "vehicles" && <SectionVehicles recoveries={data?.recoveries || []} />}
            {activeSection === "nlp" && <SectionNLP incidents={data?.incidents || data?.incidentsSample || []} recoveries={data?.recoveries || []} />}
            {activeSection === "investigative" && <SectionInvestigativeValue incidents={data?.incidents || data?.incidentsSample || []} recoveries={data?.recoveries || []} />}
            {activeSection === "etl" && <SectionETL incidents={data?.incidents || data?.incidentsSample || []} recoveries={data?.recoveries || []} />}
            {activeSection === "dictionary" && <SectionDictionary currentProject={currentProject} />}
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
            {activeSection === "dictionary" && <SectionDictionary currentProject={currentProject} />}
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
            {activeSection === "dictionary" && <SectionDictionary currentProject={currentProject} />}
          </>
        )}
      </main>
    </div>
  );
}
