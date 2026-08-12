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
  ShieldAlert
} from "lucide-react";
import { FilterState } from "@/lib/types";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableTipos: string[];
  availableSubtipos: string[];
}

export default function Sidebar({
  activeSection,
  setActiveSection,
  filters,
  setFilters,
  availableTipos,
  availableSubtipos,
}: SidebarProps) {
  const sections = [
    { id: "overview", label: "Dashboard / Resumen Investigativo", icon: <LayoutDashboard size={18} /> },
    { id: "map", label: "Mapeo & Geointeligencia", icon: <MapPin size={18} /> },
    { id: "recovery-tracker", label: "Trazabilidad Robo ➔ Hallazgo", icon: <Car size={18} /> },
    { id: "gang-intelligence", label: "Inteligencia de Bandas & M.O.", icon: <ShieldAlert size={18} /> },
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

  const resetFilters = () => {
    setFilters({
      tipo: "todos",
      subtipo: "todos",
      franjaHoraria: "todos",
      diaSemana: "todos",
      origenDataset: "todos",
    });
  };

  return (
    <aside className="app-sidebar">
      <div className="nav-section-label">Inteligencia e Investigación 911</div>
      {sections.map((sec) => (
        <button
          key={sec.id}
          className={`nav-item ${activeSection === sec.id ? "active" : ""}`}
          onClick={() => setActiveSection(sec.id)}
        >
          {sec.icon}
          <span>{sec.label}</span>
        </button>
      ))}

      <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Filter size={14} /> Filtros Investigativos
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
              <option value="Madrugada (00-06)">Madrugada (00-06 hs)</option>
              <option value="Mañana (06-12)">Mañana (06-12 hs)</option>
              <option value="Tarde (12-18)">Tarde (12-18 hs)</option>
              <option value="Noche (18-24)">Noche (18-24 hs) [Pico]</option>
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
              <option value="Sábado">Sábado [Pico]</option>
              <option value="Domingo">Domingo</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}
