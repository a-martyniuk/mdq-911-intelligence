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
  // Sections for Mar del Plata (Vehicular & General 911)
  const mdpSections = [
    { id: "overview", label: "Panel de Control / Resumen Investigativo", icon: <LayoutDashboard size={18} /> },
    { id: "map", label: "Mapeo & Geointeligencia", icon: <MapPin size={18} /> },
    { id: "recovery-tracker", label: "Trazabilidad Robo ➔ Hallazgo", icon: <Car size={18} /> },
    { id: "gang-intelligence", label: "Inteligencia de Bandas & M.O.", icon: <ShieldAlert size={18} /> },
    { id: "jurisdictions", label: "Matriz Inter-Jurisdiccional (Comisarías 1ra-16ta)", icon: <Building2 size={18} /> },
    { id: "graph", label: "Grafo Relacional & Redes", icon: <Workflow size={18} /> },
    { id: "search", label: "Buscador Universal de Patentes", icon: <Search size={18} /> },
    { id: "hotspots", label: "Concentración Delictiva", icon: <Flame size={18} /> },
    { id: "temporal", label: "Patrones Temporales & Cronología", icon: <Clock size={18} /> },
    { id: "vehicles", label: "Robos, Hallazgos & Cruce de Patentes", icon: <Car size={18} /> },
    { id: "nlp", label: "Extracción NLP de Entidades", icon: <FileText size={18} /> },
    { id: "investigative", label: "Patrones Relacionales & Hallazgos", icon: <Search size={18} /> },
    { id: "etl", label: "Pipeline & Ingesta de Datos", icon: <Workflow size={18} /> },
    { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={18} /> },
  ];

  // Sections for José C. Paz (Narcocriminalidad & Drogas)
  const jcpSections = [
    { id: "drogas-overview", label: "Resumen Ejecutivo Narcocriminalidad", icon: <LayoutDashboard size={18} /> },
    { id: "drogas-map", label: "Mapa Táctico de Puntos & Búnkers", icon: <MapPin size={18} /> },
    { id: "drogas-temporal", label: "Patrones Temporales & Nocturnidad", icon: <Clock size={18} /> },
    { id: "drogas-hotspots", label: "Concentración Criminal & Esquinas", icon: <Flame size={18} /> },
    { id: "drogas-nlp", label: "Inteligencia de Alias & Redes (NLP)", icon: <Brain size={18} /> },
    { id: "drogas-graph", label: "Grafo Relacional & Redes de Bandas", icon: <Share2 size={18} /> },
    { id: "drogas-search", label: "Buscador Universal de Denuncias 911", icon: <Search size={18} /> },
    { id: "drogas-etl", label: "Metodología & Integración ETL", icon: <Database size={18} /> },
    { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={18} /> },
  ];

  // Sections for Malvinas Argentinas (Narcocriminalidad & Drogas)
  const malvinasSections = [
    { id: "malvinas-overview", label: "Resumen Ejecutivo Narcocriminalidad", icon: <LayoutDashboard size={18} /> },
    { id: "malvinas-map", label: "Mapa Táctico de Puntos & Búnkers", icon: <MapPin size={18} /> },
    { id: "malvinas-temporal", label: "Patrones Temporales & Nocturnidad", icon: <Clock size={18} /> },
    { id: "malvinas-hotspots", label: "Concentración Criminal & Esquinas", icon: <Flame size={18} /> },
    { id: "malvinas-nlp", label: "Inteligencia de Alias & Redes (NLP)", icon: <Brain size={18} /> },
    { id: "malvinas-graph", label: "Grafo Relacional & Redes de Bandas", icon: <Share2 size={18} /> },
    { id: "malvinas-search", label: "Buscador Universal de Denuncias 911", icon: <Search size={18} /> },
    { id: "malvinas-etl", label: "Metodología & Integración ETL", icon: <Database size={18} /> },
    { id: "dictionary", label: "Diccionario de Datos", icon: <BookOpen size={18} /> },
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

  const sectionsToRender = currentProject === "mdp" ? mdpSections : currentProject === "jcp" ? jcpSections : malvinasSections;

  return (
    <aside className="app-sidebar">
      {/* Project Switcher Selector */}
      <div style={{ marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Jurisdicción activa
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("mdp");
              setActiveSection("overview");
            }}
            style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "mdp" ? "rgba(255, 255, 255, 0.16)" : "var(--border)"),
              borderLeft: currentProject === "mdp" ? "2px solid #3b82f6" : "2px solid transparent",
              background: currentProject === "mdp" ? "#1f242d" : "var(--bg-surface)",
              color: currentProject === "mdp" ? "#f8fafc" : "var(--text-secondary)",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <Car size={16} style={{ flexShrink: 0, color: currentProject === "mdp" ? "#3b82f6" : "var(--text-muted)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600 }}>Mar del Plata</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, fontFamily: "var(--font-mono)", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "var(--radius-xs)" }}>
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

          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("jcp");
              setActiveSection("drogas-overview");
            }}
            style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "jcp" ? "rgba(255, 255, 255, 0.16)" : "var(--border)"),
              borderLeft: currentProject === "jcp" ? "2px solid #3b82f6" : "2px solid transparent",
              background: currentProject === "jcp" ? "#1f242d" : "var(--bg-surface)",
              color: currentProject === "jcp" ? "#f8fafc" : "var(--text-secondary)",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <Skull size={16} style={{ flexShrink: 0, color: currentProject === "jcp" ? "#3b82f6" : "var(--text-muted)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600 }}>José C. Paz</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, fontFamily: "var(--font-mono)", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "var(--radius-xs)" }}>
                  1.770
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Drogas & Búnkers
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 31/08/2026
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              resetFilters();
              setCurrentProject("malvinas");
              setActiveSection("malvinas-overview");
            }}
            style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid " + (currentProject === "malvinas" ? "rgba(255, 255, 255, 0.16)" : "var(--border)"),
              borderLeft: currentProject === "malvinas" ? "2px solid #3b82f6" : "2px solid transparent",
              background: currentProject === "malvinas" ? "#1f242d" : "var(--bg-surface)",
              color: currentProject === "malvinas" ? "#f8fafc" : "var(--text-secondary)",
              fontSize: "0.82rem",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease"
            }}
          >
            <Crosshair size={16} style={{ flexShrink: 0, color: currentProject === "malvinas" ? "#3b82f6" : "var(--text-muted)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3rem" }}>
                <span style={{ fontWeight: 600 }}>Malvinas Argentinas</span>
                <span style={{ fontSize: "0.65rem", fontWeight: 600, fontFamily: "var(--font-mono)", background: "rgba(255, 255, 255, 0.05)", color: "var(--text-secondary)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "var(--radius-xs)" }}>
                  1.471
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "1px" }}>
                Drogas & Búnkers
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "2px" }}>
                <Calendar size={10} /> 01/01/2026 – 31/08/2026
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="nav-section-label">
        {currentProject === "mdp" ? "Inteligencia Mar del Plata" : currentProject === "jcp" ? "Inteligencia Narcocriminal JCP" : "Inteligencia Narcocriminal Malvinas"}
      </div>

      {sectionsToRender.map((sec) => (
        <button
          key={sec.id}
          className={`nav-item ${activeSection === sec.id ? "active" : ""}`}
          onClick={() => setActiveSection(sec.id)}
        >
          {sec.icon}
          <span>{sec.label}</span>
        </button>
      ))}

      {/* MDP Specific Filters */}
      {currentProject === "mdp" && (
        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Filter size={14} /> Filtros MDP
            </span>
            <button
              onClick={resetFilters}
              style={{ background: "none", border: "none", color: "var(--accent-indigo)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
              title="Resetear filtros"
            >
              <RotateCcw size={12} /> Limpiar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Filter size={14} /> Filtros {currentProject === "jcp" ? "JCP" : "Malvinas"}
            </span>
            <button
              onClick={resetFilters}
              style={{ background: "none", border: "none", color: "var(--accent-pba-cyan)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.2rem" }}
              title="Resetear filtros"
            >
              <RotateCcw size={12} /> Limpiar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
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
        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Fuentes Integradas JCP
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ background: "rgba(239,68,68,0.1)", padding: "0.5rem", borderRadius: "4px", border: "1px solid rgba(239,68,68,0.25)" }}>
              <strong style={{ color: "#ef4444", display: "block" }}>DROGAS ILÍCITAS:</strong>
              989 hechos con tipificación formal 911.
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", padding: "0.5rem", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.25)" }}>
              <strong style={{ color: "#10b981", display: "block" }}>INFORMACIÓN VECINAL:</strong>
              781 hechos rescatados por búsqueda de términos (cocaína, búnker, venta).
            </div>
          </div>
        </div>
      )}

      {/* Malvinas Specific Source Distinction Box */}
      {currentProject === "malvinas" && (
        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
          <div style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Fuentes Integradas Malvinas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div style={{ background: "rgba(245,158,11,0.1)", padding: "0.5rem", borderRadius: "4px", border: "1px solid rgba(245,158,11,0.25)" }}>
              <strong style={{ color: "#f59e0b", display: "block" }}>DROGAS ILÍCITAS:</strong>
              802 hechos con tipificación formal 911.
            </div>
            <div style={{ background: "rgba(16,185,129,0.1)", padding: "0.5rem", borderRadius: "4px", border: "1px solid rgba(16,185,129,0.25)" }}>
              <strong style={{ color: "#10b981", display: "block" }}>INFORMACIÓN VECINAL:</strong>
              669 hechos rescatados por búsqueda semántica (cocaína, búnker, venta).
            </div>
          </div>
        </div>
      )}

    </aside>
  );
}
