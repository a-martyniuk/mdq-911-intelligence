"use client";

import React from "react";
import { Car, Skull } from "lucide-react";

interface IntroBannerProps {
  currentProject?: "mdp" | "jcp";
}

export default function IntroBanner({ currentProject = "mdp" }: IntroBannerProps) {
  if (currentProject === "jcp") {
    return (
      <div style={{
        background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(17,24,39,0.95) 100%)",
        border: "1px solid rgba(239,68,68,0.3)",
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
            color: "#f87171",
            marginBottom: "0.4rem"
          }}>
            <Skull size={14} />
            <span>Plataforma de Inteligencia Narcocriminal & Puntos de Venta · José C. Paz (JCP)</span>
          </div>

          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.4rem", lineHeight: 1.2 }}>
            JOSÉ C. PAZ — NARCOCRIMINALIDAD & DROGAS ILÍCITAS 911
          </h2>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.8rem" }}>
            Georreferenciación de Búnkers, Redes de Expendio y Conflictividad Territorial
          </h3>

          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", maxWidth: "850px", lineHeight: 1.5 }}>
            Consolidación y auditoría de <strong style={{ color: "var(--text-primary)" }}>1.770 denuncias vecinales del 911</strong> (989 despachos tipificados formalmente y 781 alertas rescatadas por filtrado semántico de relatos). Identifica búnkers y casillas, clasifica sustancias (cocaína, paco, marihuana), audita sospechosos por NLP e individualiza zonas con presencia de armamento para investigaciones y allanamientos judiciales.
          </p>
        </div>
      </div>
    );
  }

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
          <Car size={14} />
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
