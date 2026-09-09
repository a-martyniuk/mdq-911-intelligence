"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Car, Skull } from "lucide-react";
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
import SectionDrogasETL from "./SectionDrogasETL";

import { FilterState } from "@/lib/types";
import { getApiUrl, getAppPath } from "@/lib/apiUrl";

export default function Dashboard() {
  const [currentProject, setCurrentProject] = useState<"mdp" | "jcp">("mdp");
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
    const query = new URLSearchParams();
    query.set("project", currentProject);

    if (currentProject === "mdp") {
      if (filters.tipo !== "todos") query.set("tipo", filters.tipo);
      if (filters.subtipo !== "todos") query.set("subtipo", filters.subtipo);
      if (filters.franjaHoraria !== "todos") query.set("franjaHoraria", filters.franjaHoraria);
      if (filters.diaSemana !== "todos") query.set("diaSemana", filters.diaSemana);
      if (filters.origenDataset !== "todos") query.set("origenDataset", filters.origenDataset);
    }

    fetch(getApiUrl(`/api/data/incidents?${query.toString()}`))
      .then((res) => {
        if (res.status === 401) {
          window.location.href = getAppPath("/login");
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch((err) => console.error("Error loading data:", err))
      .finally(() => setLoading(false));
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
    georeferencedCount: data?.georeferencedCount || 1549,
    georeferencedPct: data?.georeferencedPct || 87.5,
    armasCount: data?.armasCount || 1369,
    armasPct: data?.armasPct || 77.3,
    cocainaCount: data?.cocainaCount || 705,
    marihuanaCount: data?.marihuanaCount || 312,
    pacoCount: data?.pacoCount || 50,
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">MSEG</div>
          <div>
            <h1 className="brand-title">MSEG — Inteligencia Delictual & Análisis Criminal 911</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.15rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Proyecto Activo:</span>
              {currentProject === "mdp" ? (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", padding: "1px 7px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <Car size={12} /> Mar del Plata (Automotores & Delito Calificado)
                </span>
              ) : (
                <span style={{ fontSize: "0.75rem", fontWeight: 700, background: "rgba(239,68,68,0.2)", color: "#fca5a5", padding: "1px 7px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <Skull size={12} /> José C. Paz (Narcocriminalidad & Puntos de Venta)
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
                height: "36px",
                padding: "0 1rem",
                fontSize: "0.8rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
              }}
            >
              📄 Dossier MDP (PDF)
            </button>
          )}

          <div className="user-badge">
            <span className="user-dot"></span>
            <span>Usuario: {user}</span>
          </div>

          <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
            <LogOut size={16} />
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
        <IntroBanner />

        {/* ======================================= */}
        {/* PROYECTO 1: MAR DEL PLATA               */}
        {/* ======================================= */}
        {currentProject === "mdp" && (
          <>
            {activeSection === "overview" && <SectionOverview stats={mdpStats} />}
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
            {activeSection === "drogas-overview" && <SectionDrogasOverview stats={jcpStats} />}
            {activeSection === "drogas-map" && <SectionDrogasMap incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-nlp" && <SectionDrogasNLP incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-hotspots" && <SectionDrogasHotspots incidents={data?.incidents || data?.geoPoints || []} />}
            {activeSection === "drogas-search" && <SectionDrogasSearch incidents={data?.incidents || []} />}
            {activeSection === "drogas-etl" && <SectionDrogasETL />}
          </>
        )}
      </main>
    </div>
  );
}
