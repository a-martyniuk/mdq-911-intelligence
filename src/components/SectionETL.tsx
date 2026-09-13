"use client";

import React, { useState } from "react";
import { Workflow, CheckCircle, ShieldCheck, Database, Layers, FileSpreadsheet, Cpu, Sparkles } from "lucide-react";

interface SectionETLProps {
  incidents?: any[];
  recoveries?: any[];
}

export default function SectionETL({ incidents = [], recoveries = [] }: SectionETLProps) {
  const [selectedRule, setSelectedRule] = useState<number>(0);

  const dynamicTotal = incidents.length > 0 ? incidents.length.toLocaleString() : "8.598";
  const dynamicRecoveries = React.useMemo(() => {
    if (!recoveries || recoveries.length === 0) return 52;
    const unique = new Set(
      recoveries
        .filter((r: any) => !(r.ID_Robo && r.ID_Hallazgo && r.ID_Robo === r.ID_Hallazgo))
        .map((r: any) => r.ID_Robo)
    );
    return unique.size || 52;
  }, [recoveries]);

  const rules = [
    {
      title: "Reparación y Normalización Geográfica",
      icon: "🌐",
      desc: "Reparación automatizada de puntos con coma/punto desplazado en las coordenadas originales del 911. Ajuste a la caja delimitadora (Bounding Box) oficial de General Pueyrredón (-38.25 a -37.75 Lat / -57.75 a -57.35 Lng).",
      impact: "Alcanzó el 93.0% de georreferenciación limpia (8.000 casos geocodificados sobre mapa).",
    },
    {
      title: "Extracción NLP de Patentes y Entidades",
      icon: "🏷️",
      desc: "Minería de texto sobre los relatos libres de despacho utilizando expresiones regulares avanzadas para detectar matrículas de formato Mercosur (AA123BB) y Tradicional (AAA123).",
      impact: "Identificó 52 casos con 50 patentes únicas para trazabilidad de robos y hallazgos.",
    },
    {
      title: "Cruce Relacional Robo ➔ Hallazgo",
      icon: "🔀",
      desc: "Algoritmo de vinculación por clave única de patente y marca entre la base de denuncias de sustracción y el registro de vehículos hallados/abandonados.",
      impact: "Permitió medir el tiempo de recuperación (mediana 5,4 hs autos / 6,8 hs motos) y la prevalencia de autos (78,8%) vs motos (21,2%) en recuperos pareados.",
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
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "var(--bg-surface)", borderColor: "var(--border)", borderLeft: "4px solid var(--accent-pba-blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{ padding: "0.65rem", borderRadius: "var(--radius-sm)", background: "rgba(13, 92, 168, 0.1)", color: "var(--accent-pba-blue)", border: "1px solid rgba(13, 92, 168, 0.25)" }}>
            <Workflow size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "19px", fontWeight: 700, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
              Ingeniería de Datos & Pipeline de Ingestión 911
            </h2>
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Arquitectura del pipeline automatizado de procesamiento, limpieza, corrección geográfica y enriquecimiento relacional.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Quality Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
        <div className="card" style={{ borderLeft: "3px solid #38bdf8" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos Ingestados</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", margin: "0.2rem 0", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
            {dynamicTotal}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>100% procesados desde planillas 911</span>
        </div>

        <div className="card" style={{ borderLeft: "3px solid #10b981" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Calidad Geográfica</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#10b981", margin: "0.2rem 0", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
            93.0%
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>8.000 puntos en Bounding Box MDP</span>
        </div>

        <div className="card" style={{ borderLeft: "3px solid #f59e0b" }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Relaciones Cruzadas</span>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f59e0b", margin: "0.2rem 0", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
            {dynamicRecoveries} Vehículos
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Trazabilidad deduplicada Robo ➔ Hallazgo</span>
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
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "0.3rem 0.6rem", borderRadius: "4px" }}>
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
