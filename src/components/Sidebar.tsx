"use client";

import React from "react";
import {
  LayoutDashboard,
  MapPin,
  Flame,
  Clock,
  Car,
  FileText,
  Workflow,
  BookOpen,
  Search,
  ShieldAlert,
  Building2,
  Skull,
  Crosshair,
  Brain,
  Database,
  Share2,
  Calendar
} from "lucide-react";
import { getAssetPath } from "@/lib/apiUrl";

interface SidebarProps {
  currentProject: "mdp" | "jcp" | "malvinas";
  setCurrentProject: (proj: "mdp" | "jcp" | "malvinas") => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  filters?: any;
  setFilters?: any;
  availableTipos?: any;
  availableSubtipos?: any;
}

export default function Sidebar({
  currentProject,
  setCurrentProject,
  activeSection,
  setActiveSection,
}: SidebarProps) {
  // Categorized Navigation for Mar del Plata
  const mdpGroups = [
    {
      title: "Nivel Estratégico",
      items: [
        { id: "overview", label: "Panel de Control / Resumen", icon: <LayoutDashboard size={16} /> },
      ]
    },
    {
      title: "Geointeligencia & Territorio",
      items: [
        { id: "map", label: "Mapeo & Geointeligencia", icon: <MapPin size={16} /> },
        { id: "jurisdictions", label: "Comisarías (1ra a 16ta)", icon: <Building2 size={16} /> },
        { id: "hotspots", label: "Concentración Delictiva", icon: <Flame size={16} /> },
      ]
    },
    {
      title: "Investigación Especializada",
      items: [
        { id: "recovery-tracker", label: "Trazabilidad Robo ➔ Hallazgo", icon: <Car size={16} /> },
        { id: "gang-intelligence", label: "Inteligencia de Bandas & M.O.", icon: <ShieldAlert size={16} /> },
        { id: "vehicles", label: "Robos, Hallazgos & Patentes", icon: <Car size={16} /> },
        { id: "graph", label: "Grafo Relacional & Redes", icon: <Workflow size={16} /> },
      ]
    },
    {
      title: "Peritaje Analítico & NLP",
      items: [
        { id: "nlp", label: "Extracción NLP de Entidades", icon: <FileText size={16} /> },
        { id: "investigative", label: "Patrones & Hallazgos", icon: <Search size={16} /> },
        { id: "search", label: "Buscador Universal 911", icon: <Search size={16} /> },
        { id: "temporal", label: "Patrones Temporales", icon: <Clock size={16} /> },
      ]
    },
    {
      title: "Gobernanza & Datos",
      items: [
        { id: "etl", label: "Pipeline & Ingesta ETL", icon: <Database size={16} /> },
        { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={16} /> },
      ]
    }
  ];

  // Categorized Navigation for José C. Paz
  const jcpGroups = [
    {
      title: "Nivel Estratégico",
      items: [
        { id: "drogas-overview", label: "Resumen Ejecutivo Narcocriminalidad", icon: <LayoutDashboard size={16} /> },
      ]
    },
    {
      title: "Cartografía Táctica",
      items: [
        { id: "drogas-map", label: "Puntos de Venta & Búnkers", icon: <MapPin size={16} /> },
        { id: "drogas-hotspots", label: "Concentración & Esquinas", icon: <Flame size={16} /> },
      ]
    },
    {
      title: "Inteligencia Criminal",
      items: [
        { id: "drogas-nlp", label: "Inteligencia de Alias & NLP", icon: <Brain size={16} /> },
        { id: "drogas-graph", label: "Grafo Relacional de Bandas", icon: <Share2 size={16} /> },
        { id: "drogas-temporal", label: "Patrones Temporales & Nocturnidad", icon: <Clock size={16} /> },
      ]
    },
    {
      title: "Peritaje & Datos",
      items: [
        { id: "drogas-search", label: "Buscador de Denuncias 911", icon: <Search size={16} /> },
        { id: "drogas-etl", label: "Metodología ETL", icon: <Database size={16} /> },
        { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={16} /> },
      ]
    }
  ];

  // Categorized Navigation for Malvinas Argentinas
  const malvinasGroups = [
    {
      title: "Nivel Estratégico",
      items: [
        { id: "malvinas-overview", label: "Resumen Ejecutivo Narcocriminalidad", icon: <LayoutDashboard size={16} /> },
      ]
    },
    {
      title: "Cartografía Táctica",
      items: [
        { id: "malvinas-map", label: "Puntos de Venta & Búnkers", icon: <MapPin size={16} /> },
        { id: "malvinas-hotspots", label: "Concentración & Esquinas", icon: <Flame size={16} /> },
      ]
    },
    {
      title: "Inteligencia Criminal",
      items: [
        { id: "malvinas-nlp", label: "Inteligencia de Alias & NLP", icon: <Brain size={16} /> },
        { id: "malvinas-graph", label: "Grafo Relacional de Bandas", icon: <Share2 size={16} /> },
        { id: "malvinas-temporal", label: "Patrones Temporales & Nocturnidad", icon: <Clock size={16} /> },
      ]
    },
    {
      title: "Peritaje & Datos",
      items: [
        { id: "malvinas-search", label: "Buscador de Denuncias 911", icon: <Search size={16} /> },
        { id: "malvinas-etl", label: "Metodología ETL", icon: <Database size={16} /> },
        { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={16} /> },
      ]
    }
  ];

  const currentGroups = currentProject === "mdp" ? mdpGroups : currentProject === "jcp" ? jcpGroups : malvinasGroups;

  return (
    <aside className="app-sidebar">
      {/* Project Switcher Selector */}
      <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.55rem" }}>
          Jurisdicción Activa
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {/* Mar del Plata */}
          <button
            onClick={() => {
              setCurrentProject("mdp");
              setActiveSection("overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "mdp" ? "#2563eb" : "#334155"),
              borderLeft: currentProject === "mdp" ? "3px solid #38bdf8" : "3px solid transparent",
              background: currentProject === "mdp" ? "#172554" : "#1e293b",
              color: currentProject === "mdp" ? "#ffffff" : "#cbd5e1",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: currentProject === "mdp" ? "0 2px 6px rgba(0, 0, 0, 0.35)" : "none",
            }}
          >
            <div style={{
              background: currentProject === "mdp" ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid " + (currentProject === "mdp" ? "rgba(56, 189, 248, 0.35)" : "#334155"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "mdp" ? "#38bdf8" : "#94a3b8",
            }}>
              <Car size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "mdp" ? "#ffffff" : "#f1f5f9" }}>Mar del Plata</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.4)", color: currentProject === "mdp" ? "#38bdf8" : "#94a3b8", border: "1px solid " + (currentProject === "mdp" ? "#2563eb" : "#334155"), padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  8.598
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1px" }}>
                Automotores & 911
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 05/08/2026
              </div>
            </div>
          </button>

          {/* José C. Paz */}
          <button
            onClick={() => {
              setCurrentProject("jcp");
              setActiveSection("drogas-overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "jcp" ? "#dc2626" : "#334155"),
              borderLeft: currentProject === "jcp" ? "3px solid #ef4444" : "3px solid transparent",
              background: currentProject === "jcp" ? "#3b1219" : "#1e293b",
              color: currentProject === "jcp" ? "#ffffff" : "#cbd5e1",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: currentProject === "jcp" ? "0 2px 6px rgba(0, 0, 0, 0.35)" : "none",
            }}
          >
            <div style={{
              background: currentProject === "jcp" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid " + (currentProject === "jcp" ? "rgba(239, 68, 68, 0.35)" : "#334155"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "jcp" ? "#fca5a5" : "#94a3b8",
            }}>
              <Skull size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "jcp" ? "#ffffff" : "#f1f5f9" }}>José C. Paz</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.4)", color: currentProject === "jcp" ? "#f87171" : "#94a3b8", border: "1px solid " + (currentProject === "jcp" ? "#dc2626" : "#334155"), padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  1.770
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1px" }}>
                Narcocriminalidad & Drogas
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 31/08/2026
              </div>
            </div>
          </button>

          {/* Malvinas Argentinas */}
          <button
            onClick={() => {
              setCurrentProject("malvinas");
              setActiveSection("malvinas-overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "malvinas" ? "#d97706" : "#334155"),
              borderLeft: currentProject === "malvinas" ? "3px solid #f59e0b" : "3px solid transparent",
              background: currentProject === "malvinas" ? "#38230b" : "#1e293b",
              color: currentProject === "malvinas" ? "#ffffff" : "#cbd5e1",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.65rem",
              cursor: "pointer",
              textAlign: "left",
              boxShadow: currentProject === "malvinas" ? "0 2px 6px rgba(0, 0, 0, 0.35)" : "none",
            }}
          >
            <div style={{
              background: currentProject === "malvinas" ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.05)",
              border: "1px solid " + (currentProject === "malvinas" ? "rgba(245, 158, 11, 0.35)" : "#334155"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "malvinas" ? "#fcd34d" : "#94a3b8",
            }}>
              <Crosshair size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "malvinas" ? "#ffffff" : "#f1f5f9" }}>Malvinas Argentinas</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.4)", color: currentProject === "malvinas" ? "#fbbf24" : "#94a3b8", border: "1px solid " + (currentProject === "malvinas" ? "#d97706" : "#334155"), padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  1.471
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "1px" }}>
                Narcocriminalidad & Puntos
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "#64748b", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 31/08/2026
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Categorized Navigation Groups */}
      {currentGroups.map((grp, gIdx) => (
        <div key={gIdx} style={{ marginBottom: "0.85rem" }}>
          <div className="nav-section-label">
            <span>{grp.title}</span>
          </div>
          {grp.items.map((sec) => (
            <button
              key={sec.id}
              className={`nav-item ${activeSection === sec.id ? "active" : ""}`}
              onClick={() => setActiveSection(sec.id)}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      ))}

      {/* MDP Specific Source Distinction Box */}
      {currentProject === "mdp" && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e293b", fontSize: "0.75rem" }}>
          <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.68rem" }}>
            Fuentes Integradas Mar del Plata
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div style={{ background: "rgba(56, 189, 248, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#38bdf8", fontSize: "0.74rem" }}>ROBOS AUTOMOTOR</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>7.973</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Despacho formal 911 / Sustracciones</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.74rem" }}>HALLAZGOS / DESCARTES</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>625</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Recuperos y vehículos abandonados</div>
            </div>
          </div>
        </div>
      )}

      {/* JCP Specific Source Distinction Box */}
      {currentProject === "jcp" && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e293b", fontSize: "0.75rem" }}>
          <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.68rem" }}>
            Fuentes Integradas JCP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#f87171", fontSize: "0.74rem" }}>DROGAS ILÍCITAS</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>989</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Tipificación policial formal 911</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.74rem" }}>INFORMACIÓN VECINAL</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>781</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Búsqueda semántica en relatos</div>
            </div>
          </div>
        </div>
      )}

      {/* Malvinas Specific Source Distinction Box */}
      {currentProject === "malvinas" && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #1e293b", fontSize: "0.75rem" }}>
          <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.68rem" }}>
            Fuentes Integradas Malvinas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#fbbf24", fontSize: "0.74rem" }}>DROGAS ILÍCITAS</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>802</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Tipificación policial formal 911</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.74rem" }}>INFORMACIÓN VECINAL</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>669</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Búsqueda semántica en relatos</div>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
