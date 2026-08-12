"use client";

import React, { useState } from "react";
import { Workflow, CheckCircle, ShieldCheck, Database, Layers, FileSpreadsheet, Cpu, Sparkles } from "lucide-react";

export default function SectionETL() {
  const [selectedRule, setSelectedRule] = useState<number>(0);

  const rules = [
    {
      title: "Reparación y Normalización Geográfica",
      icon: "🌐",
      desc: "Reparación automatizada de puntos con coma/punto desplazado en las coordenadas originales del 911. Ajuste a la caja delimitadora (Bounding Box) oficial de General Pueyrredón (-38.25 a -37.75 Lat / -57.75 a -57.35 Lng).",
      impact: "Alcanzó el 93.5% de georreferenciación limpia (8.035 casos sobre mapa).",
    },
    {
      title: "Extracción NLP de Patentes y Entidades",
      icon: "🏷️",
      desc: "Minería de texto sobre los relatos libres de despacho utilizando expresiones regulares avanzadas para detectar matrículas de formato Mercosur (AA123BB) y Tradicional (AAA123).",
      impact: "Identificó 58 patentes cruzadas para trazabilidad de robos y hallazgos.",
    },
    {
      title: "Cruce Relacional Robo ➔ Hallazgo",
      icon: "🔀",
      desc: "Algoritmo de vinculación por clave única de patente y marca entre la base de denuncias de sustracción y el registro de vehículos hallados/abandonados.",
      impact: "Permitió medir el tiempo exacto de recuperación y la divergencia entre autos (64.9% recuperados) y motos (19.7%).",
    },
    {
      title: "Enriquecimiento Espacio-Temporal",
      icon: "🕒",
      desc: "Parseo de marcas temporales para categorizar cada incidente por hora exacta (00-23hs), día de la semana (con indicador de fin de semana) y franja horaria crítica.",
      impact: "Identificó la Franja Nocturna (18-24 hs) como el pico del 39.5% de los delitos.",
    },
  ];

  const pipelineSteps = [
    { step: "01", title: "Ingesta de Archivos 911", desc: "4 archivos Excel de despacho de emergencias", color: "#6366f1" },
    { step: "02", title: "Consolidación de Filas", desc: "Ingestión de 8.598 registros de llamados", color: "#8b5cf6" },
    { step: "03", title: "Sanitización de Campos", desc: "Estandarización de nulos y nombres de columnas", color: "#ec4899" },
    { step: "04", title: "Corrección Decimal Geo", desc: "Ajuste de coordenadas al Bounding Box de MDP", color: "#ef4444" },
    { step: "05", title: "Extracción Temporal", desc: "Cálculo de hora, día, franja y fin de semana", color: "#f59e0b" },
    { step: "06", title: "Minería NLP de Relatos", desc: "Parsing de patentes, marcas y armamento", color: "#10b981" },
    { step: "07", title: "Matching por Patente", desc: "Vinculación relacional entre Robo y Hallazgo", color: "#06b6d4" },
    { step: "08", title: "Cálculo de Tiempos", desc: "Diferencial en horas hasta la recuperación", color: "#3b82f6" },
    { step: "09", title: "Almacenamiento Parquet", desc: "Almacenamiento comprimido para consumo web", color: "#6366f1" },
    { step: "10", title: "Servicio API & Dashboard", desc: "Plataforma de Inteligencia en tiempo real", color: "#10b981" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(16,185,129,0.08) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-indigo)", color: "#fff" }}>
            <Workflow size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Ingeniería de Datos & Pipeline de Ingestión 911
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Arquitectura del pipeline automatizado de procesamiento, limpieza, corrección geográfica y enriquecimiento relacional.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Quality Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderLeft: "4px solid var(--accent-indigo)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Datos Ingestados</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.3rem 0" }}>
            8.598 Registros
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>100% procesados desde planillas 911</span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Calidad Geográfica</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", margin: "0.3rem 0" }}>
            93.5% Validados
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>8.035 puntos en Bounding Box MDP</span>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--accent-amber)" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Relaciones Cruzadas</span>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-amber)", margin: "0.3rem 0" }}>
            58 Vehículos
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Trazabilidad completa Robo ➔ Hallazgo</span>
        </div>
      </div>

      {/* 10 Step Visual Pipeline */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          <Layers size={20} color="var(--accent-indigo)" />
          <span>Pipeline de Procesamiento en 10 Etapas</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {pipelineSteps.map((s) => (
            <div
              key={s.step}
              style={{
                background: "var(--bg-base)",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${s.color}`,
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: s.color, marginBottom: "0.2rem" }}>
                ETAPA {s.step}
              </div>
              <strong style={{ fontSize: "0.875rem", color: "var(--text-primary)", display: "block", marginBottom: "0.3rem" }}>
                {s.title}
              </strong>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Governance & Business Cleansing Rules */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: "1rem" }}>
          <ShieldCheck size={20} color="#10b981" />
          <span>Reglas de Gobernanza & Transformación de Datos</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {rules.map((r, idx) => {
            const isSelected = selectedRule === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedRule(idx)}
                style={{
                  background: isSelected ? "rgba(99,102,241,0.1)" : "var(--bg-base)",
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSelected ? "var(--accent-indigo)" : "var(--border)"}`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>{r.icon}</span>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    {r.title}
                  </h4>
                </div>
                <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 0.6rem" }}>
                  {r.desc}
                </p>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6ee7b7", background: "rgba(16,185,129,0.15)", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
                  ✨ {r.impact}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
