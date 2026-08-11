import React from "react";

export default function IntroBanner() {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(17,24,39,0.95) 100%)",
      border: "1px solid rgba(245,158,11,0.3)",
      borderRadius: "var(--radius-lg)",
      padding: "1.75rem 2rem",
      marginBottom: "2rem",
      position: "relative",
      overflow: "hidden"
    }}>
      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--accent-indigo)",
          marginBottom: "0.4rem"
        }}>
          <span>Plataforma de Investigación e Inteligencia Relacional · Mar del Plata (MDQ)</span>
        </div>

        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem", lineHeight: 1.2 }}>
          MDQ 911 INTELLIGENCE PLATFORM
        </h2>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.8rem" }}>
          Descubrimiento de Relaciones Ocultas, Vinculación de Dominios y Modus Operandi
        </h3>

        <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "850px", lineHeight: 1.5 }}>
          Herramienta investigativa enfocada en <strong style={{ color: "var(--text-primary)" }}>extraer valor relacional a partir de 8.598 eventos del 911</strong>. Conecta denuncias de robo con hallazgos mediante NLP de dominios, analiza patrones de uso de armamento y reconstruye la cronología de operación de bandas en General Pueyrredón.
        </p>
      </div>
    </div>
  );
}
