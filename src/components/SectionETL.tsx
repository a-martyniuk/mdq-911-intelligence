"use client";

import React, { useState } from "react";
import { Workflow, Code, CheckCircle, FileCode } from "lucide-react";

export default function SectionETL() {
  const [activeCodeTab, setActiveCodeTab] = useState<"etl" | "analysis" | "runner">("etl");

  const etlCodeSnippet = `def fix_coord(val, coord_type='lat'):
    """Normaliza y repara coordenadas de latitud/longitud de General Pueyrredón."""
    if pd.isna(val):
        return np.nan
    val_str = f"{val:.0f}" if isinstance(val, (float, int)) else str(val).strip()
    val_str = val_str.replace('.', '').replace(',', '')
    
    if coord_type == 'lat':
        m = re.match(r'^(-3[78])(\d+)$', val_str)
        if m:
            fixed = float(f"{m.group(1)}.{m.group(2)}")
            if -38.25 <= fixed <= -37.75:
                return fixed
    elif coord_type == 'lng':
        m = re.match(r'^(-57)(\d+)$', val_str)
        if m:
            fixed = float(f"{m.group(1)}.{m.group(2)}")
            if -57.75 <= fixed <= -57.35:
                return fixed
    return np.nan`;

  const analysisCodeSnippet = `# Cruce por Patente entre Robos y Hallazgos
recuperados = pd.merge(
    df_robo_pat[['ID', 'Fecha', 'Patente_Principal', 'SubTipo', 'Dirección', 'Latitud_Clean', 'Longitud_Clean']],
    df_hallazgo_pat[['ID', 'Fecha', 'Patente_Principal', 'Dirección', 'Latitud_Clean', 'Longitud_Clean']],
    on='Patente_Principal',
    suffixes=('_Robo', '_Hallazgo')
)
recuperados['Horas_Hasta_Hallazgo'] = (recuperados['Fecha_Hallazgo'] - recuperados['Fecha_Robo']).dt.total_seconds() / 3600.0
recuperados = recuperados[recuperados['Horas_Hasta_Hallazgo'] >= 0].copy()`;

  const runnerSnippet = `def main():
    print("PROYECTO DATOS MAR DEL PLATA - PIPELINE DE ANÁLISIS")
    df_cons = run_etl()
    run_spatiotemporal_analysis()
    # Exportación a CSV, Parquet y Reporte Ejecutivo`;

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>⚙️ Data Engineering & Pipeline ETL</span>
        </div>
        <p className="card-subtitle">
          Arquitectura del pipeline de ingestión, limpieza, reparación de coordenadas y enriquecimiento de datos de emergencias 911.
        </p>

        {/* 10 Step Architecture Diagram */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { step: "01", title: "Datos originales 911", desc: "4 archivos Excel (.xlsx)" },
            { step: "02", title: "Ingesta Pandas", desc: "Carga de 8.598 filas" },
            { step: "03", title: "Limpieza Nulos", desc: "Estandarización de columnas" },
            { step: "04", title: "Normalización Geo", desc: "Corrección decimal lat/long" },
            { step: "05", title: "Transformación Temp.", desc: "Extracción hora, día, franja" },
            { step: "06", title: "Procesamiento NLP", desc: "RegEx sobre relatos 911" },
            { step: "07", title: "Extracción Entidades", desc: "Patentes y marcas vehiculares" },
            { step: "08", title: "Matching Vehicular", desc: "Cruce Robos vs Hallazgos" },
            { step: "09", title: "Dataset Consolidado", desc: "Exportación CSV & Parquet" },
            { step: "10", title: "Dashboard & API", desc: "Visualizaciones y servicio Web" },
          ].map((s) => (
            <div key={s.step} style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", position: "relative" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-indigo)" }}>PASO {s.step}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", margin: "0.2rem 0" }}>{s.title}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Code Inspector Tabs */}
        <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.8rem", gap: "0.4rem" }}>
          <FileCode size={18} color="var(--accent-indigo)" />
          <span>Inspección de Scripts Técnicos Reales</span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button
            className={`btn-logout ${activeCodeTab === "etl" ? "active" : ""}`}
            onClick={() => setActiveCodeTab("etl")}
          >
            src/etl_cleaner.py
          </button>
          <button
            className={`btn-logout ${activeCodeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveCodeTab("analysis")}
          >
            src/spatiotemporal_analysis.py
          </button>
          <button
            className={`btn-logout ${activeCodeTab === "runner" ? "active" : ""}`}
            onClick={() => setActiveCodeTab("runner")}
          >
            run_analysis.py
          </button>
        </div>

        <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflowX: "auto" }}>
          <pre style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
            {activeCodeTab === "etl" && etlCodeSnippet}
            {activeCodeTab === "analysis" && analysisCodeSnippet}
            {activeCodeTab === "runner" && runnerSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
