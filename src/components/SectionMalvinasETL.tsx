"use client";

import React, { useState } from "react";
import {
  Database,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  FileText,
  CheckSquare,
  Square,
  Sliders,
  Layers,
  Sparkles,
  MapPin,
  Flame,
  Clock,
} from "lucide-react";
import { generateDrogasMalvinasPDF } from "@/lib/pdfReport";

interface SectionMalvinasETLProps {
  incidents?: any[];
  stats?: any;
}

export default function SectionMalvinasETL({ incidents = [] }: SectionMalvinasETLProps) {
  // Selector Modular de Secciones para Informe PDF
  const [sections, setSections] = useState({
    tacticalMap: true,
    heatMap: true,
    chronicNodes: true,
    temporal: true,
    dispatches: true,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = () => {
    setSections({
      tacticalMap: true,
      heatMap: true,
      chronicNodes: true,
      temporal: true,
      dispatches: true,
    });
  };

  const deselectAll = () => {
    setSections({
      tacticalMap: false,
      heatMap: false,
      chronicNodes: false,
      temporal: false,
      dispatches: false,
    });
  };

  const malvinasOnlyIncidents = React.useMemo(() => {
    return incidents.filter((i: any) => {
      const p = (i.partido || "").toUpperCase();
      if (p.includes("JOSÉ") || p.includes("JOSE") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;
      const lat = Number(i.lat ?? i.Latitud_Clean ?? i.Latitud);
      // Malvinas latitude is strictly north of -34.532
      if (!isNaN(lat) && lat < -34.535) return false;
      return true;
    });
  }, [incidents]);

  const activeCount = Object.values(sections).filter(Boolean).length;

  const handleGenerateCustomPDF = () => {
    if (activeCount === 0) return;
    generateDrogasMalvinasPDF({
      totalIncidents: malvinasOnlyIncidents.length,
      georeferencedCount: malvinasOnlyIncidents.filter((r) => r.lat && r.lng).length,
      armasCount: malvinasOnlyIncidents.filter((r) => r.tieneArmas).length,
      cocainaCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCA")).length,
      marihuanaCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARI")).length,
      pacoCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
      incidents: malvinasOnlyIncidents,
      reportType: "custom",
      includedSections: sections,
      reportTitle: `Informe Modular de Inteligencia Narcocriminal · Malvinas Argentinas`,
      reportSubtitle: `Confección a medida (${activeCount} módulos analíticos seleccionados)`,
    });
  };

  const handleGenerateFullDossier = () => {
    generateDrogasMalvinasPDF({
      totalIncidents: malvinasOnlyIncidents.length,
      georeferencedCount: malvinasOnlyIncidents.filter((r) => r.lat && r.lng).length,
      armasCount: malvinasOnlyIncidents.filter((r) => r.tieneArmas).length,
      cocainaCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCA")).length,
      marihuanaCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARI")).length,
      pacoCount: malvinasOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
      incidents: malvinasOnlyIncidents,
      reportType: "dossier",
    });
  };

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card">
        <div className="card-title" style={{ gap: "0.6rem", justifyContent: "flex-start" }}>
          <Database size={20} color="#f59e0b" />
          <span>Pipeline ETL: Metodología de Integración de Datos (Malvinas Argentinas)</span>
        </div>
        <p className="card-subtitle">
          Proceso de consolidación, deduplicación y rescate de inteligencia a partir de planillas 911 de narcocriminalidad.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginTop: "1.25rem" }}>
          {/* Dataset 1 */}
          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FileSpreadsheet size={20} color="#ef4444" />
              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                DROGAS ILICITAS MALVINAS.xlsx
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              Tipificación Formal 911 (802 registros)
            </span>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.5 }}>
              Despachos y cartas de llamada clasificados formalmente por el operador o la policía bajo la carátula o ámbito de <strong>Drogas Ilícitas</strong>. Representa el núcleo institucional de causas tipificadas por estupefacientes.
            </p>
          </div>

          {/* Dataset 2 */}
          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FileSpreadsheet size={20} color="#10b981" />
              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                INFORMACION MALVINAS.xlsx
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
              Filtro de Inteligencia por Palabras Clave (670 registros)
            </span>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.5 }}>
              Llamados al 911 registrados inicialmente bajo otras tipificaciones (conflictos vecinales, cartas de información, robos o armas), pero donde un filtrado por palabras clave en el relato (<strong>"cocaína", "marihuana", "venta", "bunkers", "transa"</strong>) rescató denuncias con valiosa información sobre narcotráfico.
            </p>
          </div>
        </div>

        {/* Normalization & NLP Box */}
        <div style={{ marginTop: "1.25rem", background: "var(--bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={18} color="#a855f7" />
            Normalización Geográfica y Enriquecimiento NLP
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "3px", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Corrección Decimal y Georreferenciación Automática:</strong> Se solucionó la escala exponencial de las variables exportadas y se completó la geocodificación de intersecciones y barrios, situando a <strong>1.464 hechos (99,52%)</strong> con coordenadas espaciales validadas dentro del Partido de Malvinas Argentinas.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "3px", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Extracción de Entidades NLP:</strong> Algoritmos de expresiones regulares procesan el texto no estructurado para clasificar sustancias (Cocaína, Paco, Marihuana), presencia de armas/disparos, búnkers/ventanitas y alias de sospechosos.
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "3px", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Complementariedad Total:</strong> Se verificó que entre ambas planillas existe únicamente 1 ID coincidente, sumando un universo consolidado de <strong>1.471 denuncias únicas</strong> de alto valor judicial.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GENERADOR MODULAR DE REPORTES DE INTELIGENCIA (SELECTOR PERSONALIZADO) */}
      {/* ========================================================================= */}
      <div className="card" style={{ borderLeft: "3px solid #f59e0b", background: "var(--bg-surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.6rem", justifyContent: "flex-start" }}>
              <Sliders size={22} color="#f59e0b" />
              <span>Generador Modular de Reportes de Inteligencia (A Medida)</span>
              <span style={{ fontSize: "0.72rem", background: "#f59e0b", color: "#000", fontWeight: 800, padding: "2px 8px", borderRadius: "12px" }}>
                PERSONALIZABLE
              </span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.3rem 0 0" }}>
              Seleccione qué módulos periciales y cartográficos incluir en su informe PDF oficial de Malvinas Argentinas.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={selectAll}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                padding: "5px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Seleccionar Todos
            </button>
            <button
              onClick={deselectAll}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                padding: "5px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Deseleccionar Todos
            </button>
          </div>
        </div>

        {/* Módulos seleccionables */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.9rem", marginTop: "1.25rem" }}>
          {/* Módulo 1: Mapa Táctico */}
          <div
            onClick={() => toggleSection("tacticalMap")}
            style={{
              cursor: "pointer",
              padding: "1rem",
              borderRadius: "8px",
              border: sections.tacticalMap ? "1.5px solid #3b82f6" : "1px solid var(--border)",
              background: sections.tacticalMap ? "rgba(59,130,246,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} color="#3b82f6" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>1. Mapa Táctico Multicapa</strong>
              </div>
              {sections.tacticalMap ? <CheckSquare size={18} color="#3b82f6" /> : <Square size={18} color="var(--text-muted)" />}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Puntos georreferenciados, búnkers fortificados, comisarías PBA y polígonos RENABAP oficiales.
            </p>
          </div>

          {/* Módulo 2: Mapa Térmico KDE */}
          <div
            onClick={() => toggleSection("heatMap")}
            style={{
              cursor: "pointer",
              padding: "1rem",
              borderRadius: "8px",
              border: sections.heatMap ? "1.5px solid #ef4444" : "1px solid var(--border)",
              background: sections.heatMap ? "rgba(239,68,68,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Flame size={18} color="#ef4444" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>2. Mapa Térmico KDE</strong>
              </div>
              {sections.heatMap ? <CheckSquare size={18} color="#ef4444" /> : <Square size={18} color="var(--text-muted)" />}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Gradiente térmico continuo de densidad territorial ponderado por severidad armada y tipo de droga.
            </p>
          </div>

          {/* Módulo 3: Nodos Crónicos & Comisarías */}
          <div
            onClick={() => toggleSection("chronicNodes")}
            style={{
              cursor: "pointer",
              padding: "1rem",
              borderRadius: "8px",
              border: sections.chronicNodes ? "1.5px solid #10b981" : "1px solid var(--border)",
              background: sections.chronicNodes ? "rgba(16,185,129,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Layers size={18} color="#10b981" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>3. Nodos Crónicos & Comisarías</strong>
              </div>
              {sections.chronicNodes ? <CheckSquare size={18} color="#10b981" /> : <Square size={18} color="var(--text-muted)" />}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Ranking de 10 esquinas más críticas, sedes de comisarías PBA y tipología de puntos de expendio.
            </p>
          </div>

          {/* Módulo 4: Cronometría 24h */}
          <div
            onClick={() => toggleSection("temporal")}
            style={{
              cursor: "pointer",
              padding: "1rem",
              borderRadius: "8px",
              border: sections.temporal ? "1.5px solid #8b5cf6" : "1px solid var(--border)",
              background: sections.temporal ? "rgba(139,92,246,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={18} color="#8b5cf6" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>4. Cronometría & Nocturnidad</strong>
              </div>
              {sections.temporal ? <CheckSquare size={18} color="#8b5cf6" /> : <Square size={18} color="var(--text-muted)" />}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Curva horaria continua SVG de 24 hs, letalidad armada por franja y distribución semanal.
            </p>
          </div>

          {/* Módulo 5: Despachos Verbatim */}
          <div
            onClick={() => toggleSection("dispatches")}
            style={{
              cursor: "pointer",
              padding: "1rem",
              borderRadius: "8px",
              border: sections.dispatches ? "1.5px solid #f59e0b" : "1px solid var(--border)",
              background: sections.dispatches ? "rgba(245,158,11,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} color="#f59e0b" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>5. Despachos 911 Verbatim</strong>
              </div>
              {sections.dispatches ? <CheckSquare size={18} color="#f59e0b" /> : <Square size={18} color="var(--text-muted)" />}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
              Transcripción textual completa e inalterada de las denuncias con coordenadas periciales y alias.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
          <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
            <span style={{ fontWeight: 800, color: activeCount > 0 ? "var(--text-primary)" : "#ef4444" }}>
              {activeCount} de 5 módulos seleccionados
            </span>{" "}
            para conformar el informe pericial.
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleGenerateCustomPDF}
              disabled={activeCount === 0}
              className="btn-export btn-pdf"
              style={{
                height: "38px",
                padding: "0 1.15rem",
                opacity: activeCount > 0 ? 1 : 0.4,
                cursor: activeCount > 0 ? "pointer" : "not-allowed",
              }}
            >
              <FileText size={15} />
              <span>
                {activeCount > 0
                  ? `Reporte Personalizado (${activeCount} ${activeCount === 1 ? "módulo" : "módulos"})`
                  : "Seleccione al menos 1 módulo"}
              </span>
            </button>

            <button
              onClick={handleGenerateFullDossier}
              className="btn-export"
              style={{
                height: "38px",
                padding: "0 1.15rem",
                background: "rgba(245, 158, 11, 0.12)",
                color: "#fcd34d",
                border: "1px solid rgba(245, 158, 11, 0.35)",
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <span>Dossier Completo (5 Módulos)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



