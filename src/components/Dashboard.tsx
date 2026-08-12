"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";
import IntroBanner from "./IntroBanner";
import SectionOverview from "./SectionOverview";
import SectionMap from "./SectionMap";
import SectionHotspots from "./SectionHotspots";
import SectionTemporal from "./SectionTemporal";
import SectionVehicles from "./SectionVehicles";
import SectionNLP from "./SectionNLP";
import SectionInvestigativeValue from "./SectionInvestigativeValue";
import SectionETL from "./SectionETL";
import SectionDictionary from "./SectionDictionary";
import { FilterState } from "@/lib/types";
import { getApiUrl } from "@/lib/apiUrl";

export default function Dashboard() {
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
          router.push("/login");
        } else {
          setUser(sess.user || "admin");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // Fetch dataset metrics & geo points according to selected filters
  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filters.tipo !== "todos") query.set("tipo", filters.tipo);
    if (filters.subtipo !== "todos") query.set("subtipo", filters.subtipo);
    if (filters.franjaHoraria !== "todos") query.set("franjaHoraria", filters.franjaHoraria);
    if (filters.diaSemana !== "todos") query.set("diaSemana", filters.diaSemana);
    if (filters.origenDataset !== "todos") query.set("origenDataset", filters.origenDataset);

    fetch(getApiUrl(`/api/data/incidents?${query.toString()}`))
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d) setData(d);
      })
      .catch((err) => console.error("Error loading data:", err))
      .finally(() => setLoading(false));
  }, [filters, router]);

  const handleLogout = async () => {
    await fetch(getApiUrl("/api/auth/logout"), { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const availableTipos = ["ROBO AUTOMOTOR", "DISPAROS", "VIOLENCIA", "DROGAS ILÍCITAS", "HALLAZGO", "SOSPECHOSOS"];
  const availableSubtipos = ["MOTOS", "VEHÍCULOS", "PERSONAS", "NO FAMILIAR", "VEHICULAR", "DISPAROS", "VENTA/ELABORACIÓN"];

  if (loading && !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={36} className="animate-spin" style={{ color: "var(--accent-indigo)", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Cargando Plataforma de Investigación 911...</p>
        </div>
      </div>
    );
  }

  const stats = {
    totalIncidents: data?.totalIncidents || 8598,
    georeferencedCount: data?.georeferencedCount || 8035,
    georeferencedPct: data?.georeferencedPct || 93.5,
    nightCount: data?.nightCount || 3397,
    nightPct: data?.nightPct || 39.5,
    recoveriesCount: data?.recoveries?.length || 58,
    medianRecoveryHours: 5.4,
  };

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">911</div>
          <div className="header-title">
            <h1 className="gradient-text">MDQ 911 Intelligence Platform</h1>
            <p>Mar del Plata · Análisis Forense e Inteligencia Relacional</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="badge">
            <span className="badge-dot" />
            <span>Usuario: <strong>{user}</strong></span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        filters={filters}
        setFilters={setFilters}
        availableTipos={availableTipos}
        availableSubtipos={availableSubtipos}
      />

      {/* Main Content */}
      <main className="app-main">
        <IntroBanner />

        {activeSection === "overview" && <SectionOverview stats={stats} />}
        {activeSection === "map" && <SectionMap geoPoints={data?.geoPoints || []} />}
        {activeSection === "hotspots" && <SectionHotspots />}
        {activeSection === "temporal" && <SectionTemporal incidents={data?.incidentsSample || []} />}
        {activeSection === "vehicles" && <SectionVehicles recoveries={data?.recoveries || []} />}
        {activeSection === "nlp" && <SectionNLP />}
        {activeSection === "investigative" && <SectionInvestigativeValue />}
        {activeSection === "etl" && <SectionETL />}
        {activeSection === "dictionary" && <SectionDictionary />}
      </main>
    </div>
  );
}
