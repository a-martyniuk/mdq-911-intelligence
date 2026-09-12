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
  Filter,
  RotateCcw,
  ShieldAlert,
  Building2,
  Skull,
  Crosshair,
  Brain,
  Database,
  Share2,
  Calendar
} from "lucide-react";
import { FilterState } from "@/lib/types";
import { getAssetPath } from "@/lib/apiUrl";

interface SidebarProps {
  currentProject: "mdp" | "jcp" | "malvinas";
  setCurrentProject: (proj: "mdp" | "jcp" | "malvinas") => void;
  activeSection: string;
  setActiveSection: (sec: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableTipos: string[];
  availableSubtipos: string[];
}

export default function Sidebar({
  currentProject,
  setCurrentProject,
  activeSection,
  setActiveSection,
  filters,
  setFilters,
  availableTipos,
  availableSubtipos,
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

  const resetFilters = () => {
    setFilters({
      tipo: "todos",
      subtipo: "todos",
      franjaHoraria: "todos",
      diaSemana: "todos",
      origenDataset: "todos",
    });
  };

  const activeFiltersCount = Object.values(filters).filter((v) => v !== "todos").length;
  const currentGroups = currentProject === "mdp" ? mdpGroups : currentProject === "jcp" ? jcpGroups : malvinasGroups;

  return (
    <aside className="app-sidebar">
      {/* Project Switcher Selector */}
      <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.55rem" }}>
          Jurisdicción Activa
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
          {/* Mar del Plata */}
          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("mdp");
              setActiveSection("overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "mdp" ? "rgba(59, 130, 246, 0.4)" : "var(--border)"),
              borderLeft: currentProject === "mdp" ? "3px solid #3b82f6" : "3px solid transparent",
              background: currentProject === "mdp" ? "#162238" : "var(--bg-surface)",
              color: currentProject === "mdp" ? "#f8fafc" : "var(--text-secondary)",
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
              background: currentProject === "mdp" ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.03)",
              border: "1px solid " + (currentProject === "mdp" ? "rgba(59, 130, 246, 0.3)" : "var(--border-subtle)"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "mdp" ? "#38bdf8" : "var(--text-muted)",
            }}>
              <Car size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "mdp" ? "#ffffff" : "var(--text-primary)" }}>Mar del Plata</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.35)", color: currentProject === "mdp" ? "#38bdf8" : "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  8.598
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Automotores & 911
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 05/08/2026
              </div>
            </div>
          </button>

          {/* José C. Paz */}
          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("jcp");
              setActiveSection("drogas-overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "jcp" ? "rgba(239, 68, 68, 0.4)" : "var(--border)"),
              borderLeft: currentProject === "jcp" ? "3px solid #ef4444" : "3px solid transparent",
              background: currentProject === "jcp" ? "#22161b" : "var(--bg-surface)",
              color: currentProject === "jcp" ? "#f8fafc" : "var(--text-secondary)",
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
              background: currentProject === "jcp" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.03)",
              border: "1px solid " + (currentProject === "jcp" ? "rgba(239, 68, 68, 0.3)" : "var(--border-subtle)"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "jcp" ? "#fca5a5" : "var(--text-muted)",
            }}>
              <Skull size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "jcp" ? "#ffffff" : "var(--text-primary)" }}>José C. Paz</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.35)", color: currentProject === "jcp" ? "#f87171" : "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  1.770
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Narcocriminalidad & Drogas
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 31/08/2026
              </div>
            </div>
          </button>

          {/* Malvinas Argentinas */}
          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("malvinas");
              setActiveSection("malvinas-overview");
            }}
            className="project-card"
            style={{
              padding: "0.65rem 0.8rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "malvinas" ? "rgba(245, 158, 11, 0.4)" : "var(--border)"),
              borderLeft: currentProject === "malvinas" ? "3px solid #f59e0b" : "3px solid transparent",
              background: currentProject === "malvinas" ? "#221e14" : "var(--bg-surface)",
              color: currentProject === "malvinas" ? "#f8fafc" : "var(--text-secondary)",
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
              background: currentProject === "malvinas" ? "rgba(245, 158, 11, 0.2)" : "rgba(255, 255, 255, 0.03)",
              border: "1px solid " + (currentProject === "malvinas" ? "rgba(245, 158, 11, 0.3)" : "var(--border-subtle)"),
              borderRadius: "var(--radius-xs)",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentProject === "malvinas" ? "#fcd34d" : "var(--text-muted)",
            }}>
              <Crosshair size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600, color: currentProject === "malvinas" ? "#ffffff" : "var(--text-primary)" }}>Malvinas Argentinas</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, fontFamily: "var(--font-mono)", background: "rgba(0, 0, 0, 0.35)", color: currentProject === "malvinas" ? "#fbbf24" : "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 6px", borderRadius: "var(--radius-xs)" }}>
                  1.471
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Narcocriminalidad & Puntos
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
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

      {/* MDP Specific Filters */}
      {currentProject === "mdp" && (
        <div style={{
          marginTop: "1.25rem",
          padding: "0.85rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Filter size={13} style={{ color: "var(--accent-pba-cyan)" }} />
              <span>Filtros Operativos</span>
              {activeFiltersCount > 0 && (
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: "#1d4ed8",
                  color: "#ffffff",
                  padding: "0.5px 5px",
                  borderRadius: "10px"
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <button
              onClick={resetFilters}
              style={{
                background: "none",
                border: "none",
                color: activeFiltersCount > 0 ? "var(--accent-pba-cyan)" : "var(--text-muted)",
                cursor: activeFiltersCount > 0 ? "pointer" : "default",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontWeight: 500,
                opacity: activeFiltersCount > 0 ? 1 : 0.6
              }}
              title="Resetear filtros"
            >
              <RotateCcw size={11} /> Limpiar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label className="form-label">Origen Dataset</label>
              <select
                className="form-select"
                value={filters.origenDataset}
                onChange={(e) => setFilters((f) => ({ ...f, origenDataset: e.target.value }))}
              >
                <option value="todos">Todos los Orígenes</option>
                <option value="ROBO_AUTO_MOTO">Robo Auto-Moto</option>
                <option value="HALLAZGO_AUTOMOTOR">Hallazgo Automotor</option>
                <option value="DISPAROS_PERSONAS">Disparos a Personas</option>
                <option value="ARMA_FUEGO">Armas de Fuego</option>
              </select>
            </div>

            <div>
              <label className="form-label">Tipo de Incidente</label>
              <select
                className="form-select"
                value={filters.tipo}
                onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
              >
                <option value="todos">Todos los Tipos</option>
                {availableTipos.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Subtipo</label>
              <select
                className="form-select"
                value={filters.subtipo}
                onChange={(e) => setFilters((f) => ({ ...f, subtipo: e.target.value }))}
              >
                <option value="todos">Todos los Subtipos</option>
                {availableSubtipos.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Franja Horaria</label>
              <select
                className="form-select"
                value={filters.franjaHoraria}
                onChange={(e) => setFilters((f) => ({ ...f, franjaHoraria: e.target.value }))}
              >
                <option value="todos">Todas las Franjas</option>
                <option value="Madrugada">Madrugada (00:00 - 06:00)</option>
                <option value="Mañana">Mañana (06:00 - 12:00)</option>
                <option value="Tarde">Tarde (12:00 - 18:00)</option>
                <option value="Noche">Noche (18:00 - 24:00)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Día de la Semana</label>
              <select
                className="form-select"
                value={filters.diaSemana}
                onChange={(e) => setFilters((f) => ({ ...f, diaSemana: e.target.value }))}
              >
                <option value="todos">Todos los Días</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* JCP / Malvinas Specific Filters */}
      {(currentProject === "jcp" || currentProject === "malvinas") && (
        <div style={{
          marginTop: "1.25rem",
          padding: "0.85rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-light)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Filter size={13} style={{ color: currentProject === "jcp" ? "var(--accent-red)" : "var(--accent-amber)" }} />
              <span>Filtros {currentProject === "jcp" ? "JCP" : "Malvinas"}</span>
              {activeFiltersCount > 0 && (
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  background: currentProject === "jcp" ? "#b91c1c" : "#d97706",
                  color: "#ffffff",
                  padding: "0.5px 5px",
                  borderRadius: "10px"
                }}>
                  {activeFiltersCount}
                </span>
              )}
            </span>
            <button
              onClick={resetFilters}
              style={{
                background: "none",
                border: "none",
                color: activeFiltersCount > 0 ? (currentProject === "jcp" ? "var(--accent-red)" : "var(--accent-amber)") : "var(--text-muted)",
                cursor: activeFiltersCount > 0 ? "pointer" : "default",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontWeight: 500,
                opacity: activeFiltersCount > 0 ? 1 : 0.6
              }}
              title="Resetear filtros"
            >
              <RotateCcw size={11} /> Limpiar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <label className="form-label">Origen de Datos</label>
              <select
                className="form-select"
                value={filters.origenDataset}
                onChange={(e) => setFilters((f) => ({ ...f, origenDataset: e.target.value }))}
              >
                <option value="todos">Todos los Orígenes</option>
                <option value="DROGAS_ILICITAS_FORMAL">Tipificación Formal 911</option>
                <option value="INFORMACION_VECINAL_KEYWORDS">Información Vecinal (Relatos)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Sustancia</label>
              <select
                className="form-select"
                value={filters.subtipo}
                onChange={(e) => setFilters((f) => ({ ...f, subtipo: e.target.value }))}
              >
                <option value="todos">Todas las Sustancias</option>
                <option value="cocaina">Cocaína / Clorhidrato</option>
                <option value="paco">Paco / Pasta Base</option>
                <option value="marihuana">Marihuana / Flores</option>
              </select>
            </div>

            <div>
              <label className="form-label">Franja Horaria</label>
              <select
                className="form-select"
                value={filters.franjaHoraria}
                onChange={(e) => setFilters((f) => ({ ...f, franjaHoraria: e.target.value }))}
              >
                <option value="todos">Todas las Franjas</option>
                <option value="Madrugada">Madrugada (00:00 - 06:00)</option>
                <option value="Mañana">Mañana (06:00 - 12:00)</option>
                <option value="Tarde">Tarde (12:00 - 18:00)</option>
                <option value="Noche">Noche (18:00 - 24:00)</option>
              </select>
            </div>

            <div>
              <label className="form-label">Día de la Semana</label>
              <select
                className="form-select"
                value={filters.diaSemana}
                onChange={(e) => setFilters((f) => ({ ...f, diaSemana: e.target.value }))}
              >
                <option value="todos">Todos los Días</option>
                <option value="Lunes">Lunes</option>
                <option value="Martes">Martes</option>
                <option value="Miércoles">Miércoles</option>
                <option value="Jueves">Jueves</option>
                <option value="Viernes">Viernes</option>
                <option value="Sábado">Sábado</option>
                <option value="Domingo">Domingo</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* JCP Specific Source Distinction Box */}
      {currentProject === "jcp" && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem", fontSize: "0.68rem" }}>
            Fuentes Integradas JCP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div style={{ background: "rgba(239, 68, 68, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#f87171", fontSize: "0.74rem" }}>DROGAS ILÍCITAS</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>989</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Tipificación policial formal 911</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.74rem" }}>INFORMACIÓN VECINAL</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>781</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Búsqueda semántica en relatos</div>
            </div>
          </div>
        </div>
      )}

      {/* Malvinas Specific Source Distinction Box */}
      {currentProject === "malvinas" && (
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <div style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem", fontSize: "0.68rem" }}>
            Fuentes Integradas Malvinas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#fbbf24", fontSize: "0.74rem" }}>DROGAS ILÍCITAS</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>802</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Tipificación policial formal 911</div>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "0.55rem 0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                <strong style={{ color: "#34d399", fontSize: "0.74rem" }}>INFORMACIÓN VECINAL</strong>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#ffffff", fontWeight: 700 }}>669</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Búsqueda semántica en relatos</div>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
