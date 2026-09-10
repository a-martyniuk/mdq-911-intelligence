"use client";

import React from "react";
import { Database, GitCompare, CheckCircle2, ShieldAlert, Cpu, ArrowRight, FileSpreadsheet } from "lucide-react";

export default function SectionMalvinasETL() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card">
        <div className="card-title" style={{ gap: "0.5rem" }}>
          <Database size={24} color="var(--accent-indigo)" />
          <span>Pipeline ETL: Metodología de Integración de Datos (Malvinas Argentinas)</span>
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
                DROGAS ILICITAS MALVINAS.xlsx
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
                INFORMACION MALVINAS.xlsx
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
                <strong style={{ color: "var(--text-primary)" }}>Corrección Decimal y Georreferenciación Automática:</strong> Se solucionó la escala exponencial de las variables exportadas y se completó la geocodificación de intersecciones y barrios, situando a <strong>1.763 hechos (99,60%)</strong> con coordenadas espaciales validadas dentro del Partido de Malvinas Argentinas.
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
    </div>
  );
}


