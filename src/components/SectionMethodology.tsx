import React from "react";
import { Cpu, CheckCircle2, Layers } from "lucide-react";

export default function SectionMethodology() {
  const steps = [
    { num: "01", name: "Ingesta", desc: "Carga automatizada de archivos Excel multi-hoja con Pandas." },
    { num: "02", name: "ETL & Sanitización", desc: "Corrección de nulos, tipos de datos y nombres de columna." },
    { num: "03", name: "Normalización Geográfica", desc: "Algoritmo de reajuste decimal de latitud/longitud (-38.00, -57.56)." },
    { num: "04", name: "Enriquecimiento Temporal", desc: "Cálculo de hora, día, franja horaria y fin de semana." },
    { num: "05", name: "NLP & Extracción RegEx", desc: "Extracción no estructurada de patentes y marcas desde relatos." },
    { num: "06", name: "Matching Vehicular", desc: "Cruce relacional entre denuncias de robo y hallazgos vehiculares." },
    { num: "07", name: "Análisis Estadístico", desc: "Agregación y cálculo de percentiles de tiempo de recuperación." },
    { num: "08", name: "Análisis Espacial (KDE)", desc: "Generación de superficies de densidad y mapas de calor con Plotly/Seaborn." },
    { num: "09", name: "Exportación Parquet", desc: "Almacenamiento comprimido de alta velocidad para consumo API." },
    { num: "10", name: "Servicio Web & Dashboard", desc: "Interfaz Web interactiva autenticada con Next.js y React 19." },
  ];

  const technologies = [
    { name: "Python 3.12", type: "Core Data Engineering" },
    { name: "Pandas & NumPy", type: "Data Wrangling" },
    { name: "RegEx / NLP", type: "Text Mining" },
    { name: "Plotly.js", type: "Interactive Visualization" },
    { name: "Leaflet.js", type: "Geospatial Maps" },
    { name: "Next.js 16 (App Router)", type: "Web Framework" },
    { name: "React 19 & TypeScript", type: "Frontend UI" },
    { name: "Bcryptjs & HTTPOnly Session", type: "Server Authentication" },
    { name: "Apache Parquet", type: "High Speed Storage" },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>🛠️ Metodología Técnica y Tecnologías</span>
        </div>
        <p className="card-subtitle">
          Explicación del flujo de trabajo analítico y la arquitectura tecnológica empleada en el proyecto.
        </p>

        {/* Tech Stack Badges */}
        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.8rem" }}>Technologies & Stack</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {technologies.map((tech) => (
              <div key={tech.name} style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                <strong style={{ color: "var(--accent-indigo)", fontSize: "0.95rem" }}>{tech.name}</strong>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>{tech.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Methodology Steps */}
        <h4 style={{ fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "0.8rem" }}>Pasos Metodológicos</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
          {steps.map((s) => (
            <div key={s.num} style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--accent-green)" }}>PASO {s.num}</div>
              <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem", display: "block", margin: "0.2rem 0" }}>{s.name}</strong>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
