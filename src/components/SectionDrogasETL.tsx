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
import { generateDrogasJcpPDF } from "@/lib/pdfReport";

interface SectionDrogasETLProps {
  incidents?: any[];
  stats?: any;
}

export default function SectionDrogasETL({ incidents = [] }: SectionDrogasETLProps) {
  // Estado para la Opción B: Selector Modular de Secciones para Informe PDF
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

  const jcpOnlyIncidents = React.useMemo(() => {
    return incidents.filter((i: any) => {
      const p = (i.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;
      return true;
    });
  }, [incidents]);

  const activeCount = Object.values(sections).filter(Boolean).length;

  const handleGenerateCustomPDF = () => {
    if (activeCount === 0) return;
    generateDrogasJcpPDF({
      totalIncidents: jcpOnlyIncidents.length,
      georeferencedCount: jcpOnlyIncidents.filter((r) => r.lat && r.lng).length,
      armasCount: jcpOnlyIncidents.filter((r) => r.tieneArmas).length,
      cocainaCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCA")).length,
      marihuanaCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARI")).length,
      pacoCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
      incidents: jcpOnlyIncidents,
      reportType: "custom",
      includedSections: sections,
      reportTitle: `Informe Modular de Inteligencia Narcocriminal · José C. Paz`,
      reportSubtitle: `Confección a medida (${activeCount} módulos analíticos seleccionados)`,
    });
  };

  const handleGenerateFullDossier = () => {
    generateDrogasJcpPDF({
      totalIncidents: jcpOnlyIncidents.length,
      georeferencedCount: jcpOnlyIncidents.filter((r) => r.lat && r.lng).length,
      armasCount: jcpOnlyIncidents.filter((r) => r.tieneArmas).length,
      cocainaCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("COCA")).length,
      marihuanaCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("MARI")).length,
      pacoCount: jcpOnlyIncidents.filter((r) => (r.sustancia || "").toUpperCase().includes("PACO")).length,
      incidents: jcpOnlyIncidents,
      reportType: "dossier",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card">
        <div className="card-title" style={{ gap: "0.6rem", justifyContent: "flex-start" }}>
          <Database size={24} color="#dc2626" />
          <span>Pipeline ETL: Metodología de Integración de Datos (José C. Paz)</span>
        </div>
        <p className="card-subtitle">
          Proceso de consolidación, deduplicación y rescate de inteligencia a partir de planillas 911 de narcocriminalidad.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
          {/* Dataset 1 */}
          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <FileSpreadsheet size={20} color="#ef4444" />
              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                DROGAS ILICITAS JOSE C PAZ.xlsx
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
              Tipificación Formal 911 (989 registros)
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
                INFORMACION.xlsx
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(16,185,129,0.15)", color: "#10b981" }}>
              Filtro de Inteligencia por Palabras Clave (781 registros)
            </span>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.5 }}>
              Llamados al 911 registrados inicialmente bajo otras tipificaciones (conflictos vecinales, cartas de información, robos o armas), pero donde un filtrado por palabras clave en el relato (<strong>"cocaína", "marihuana", "venta", "bunkers", "transa"</strong>) rescató denuncias con valiosa información sobre narcotráfico.
            </p>
          </div>
        </div>

        {/* Normalization & NLP Box */}
        <div style={{ marginTop: "1.5rem", background: "var(--bg-base)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Cpu size={18} color="var(--accent-purple)" />
            Normalización Geográfica y Enriquecimiento NLP
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#10b981" style={{ marginTop: "3px", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "var(--text-primary)" }}>Corrección Decimal y Georreferenciación Automática:</strong> Se solucionó la escala exponencial de las variables exportadas y se completó la geocodificación de intersecciones y barrios, situando a <strong>1.763 hechos (99,60%)</strong> con coordenadas espaciales validadas dentro del Partido de José C. Paz.
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
                <strong style={{ color: "var(--text-primary)" }}>Complementariedad Total:</strong> Se verificó que entre ambas planillas existe únicamente 1 ID coincidente, sumando un universo consolidado de <strong>1.770 denuncias únicas</strong> de alto valor judicial.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OPCIÓN B: GENERADOR MODULAR DE REPORTES DE INTELIGENCIA (SELECTOR PERSONALIZADO) */}
      {/* ========================================================================= */}
      <div className="card" style={{ border: "1.5px solid #dc2626", background: "linear-gradient(180deg, rgba(220,38,38,0.03) 0%, rgba(15,23,42,0.6) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div className="card-title" style={{ gap: "0.6rem", justifyContent: "flex-start" }}>
              <Sliders size={22} color="#ef4444" />
              <span>Generador Modular de Reportes de Inteligencia (A Medida)</span>
              <span style={{ fontSize: "0.72rem", background: "#ef4444", color: "#fff", fontWeight: 800, padding: "2px 8px", borderRadius: "12px" }}>
                PERSONALIZABLE
              </span>
            </div>
            <p className="card-subtitle" style={{ margin: "0.3rem 0 0" }}>
              Seleccione qué módulos periciales y cartográficos incluir en su informe PDF oficial de José C. Paz.
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
              border: sections.dispatches ? "1.5px solid #dc2626" : "1px solid var(--border)",
              background: sections.dispatches ? "rgba(220,38,38,0.08)" : "var(--bg-base)",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={18} color="#dc2626" />
                <strong style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>5. Despachos 911 Verbatim</strong>
              </div>
              {sections.dispatches ? <CheckSquare size={18} color="#dc2626" /> : <Square size={18} color="var(--text-muted)" />}
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
              className="btn-logout"
              style={{
                height: "40px",
                padding: "0 1.25rem",
                fontSize: "0.82rem",
                fontWeight: 800,
                background: activeCount > 0 ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "rgba(255,255,255,0.05)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: activeCount > 0 ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: activeCount > 0 ? "0 2px 10px rgba(239,68,68,0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <FileText size={16} />
              <span>
                {activeCount > 0
                  ? `📄 Generar Reporte Personalizado (${activeCount} ${activeCount === 1 ? "módulo" : "módulos"})`
                  : "Seleccione al menos 1 módulo"}
              </span>
            </button>

            <button
              onClick={handleGenerateFullDossier}
              className="btn-logout"
              style={{
                height: "40px",
                padding: "0 1.1rem",
                fontSize: "0.82rem",
                fontWeight: 700,
                background: "rgba(255,255,255,0.08)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Sparkles size={15} color="#ef4444" />
              <span>Dossier Completo (5 Módulos)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

