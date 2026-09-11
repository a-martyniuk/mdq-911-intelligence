"use client";

import React from "react";
import { Car, Skull, Crosshair } from "lucide-react";

interface IntroBannerProps {
  currentProject?: "mdp" | "jcp" | "malvinas";
}

export default function IntroBanner({ currentProject = "mdp" }: IntroBannerProps) {
  if (currentProject === "malvinas") {
    return (
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid var(--accent-amber)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        position: "relative"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          color: "var(--accent-amber)",
          marginBottom: "0.35rem"
        }}>
          <Crosshair size={13} />
          <span>Plataforma de Inteligencia Narcocriminal & Puntos de Venta · Malvinas Argentinas</span>
        </div>

        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem", lineHeight: 1.2, fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
          MALVINAS ARGENTINAS — NARCOCRIMINALIDAD & DROGAS ILÍCITAS 911
        </h2>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
          Georreferenciación de Búnkers, Redes de Expendio y Conflictividad Territorial (6 Localidades)
        </h3>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "880px", lineHeight: 1.5 }}>
          Consolidación y auditoría de <strong style={{ color: "var(--text-primary)" }}>1.471 denuncias vecinales del 911</strong> (802 despachos tipificados formalmente y 669 alertas de información vecinal). Cobertura del 98.6% georreferenciada en Grand Bourg, Los Polvorines, Pablo Nogués, Tortuguitas, Villa de Mayo y Sourdeaux. Identificación de 10 nodos crónicos de resistencia, búnkers y zonas con alta presencia de armamento (72.0%).
        </p>
      </div>
    );
  }

  if (currentProject === "jcp") {
    return (
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderLeft: "4px solid var(--accent-red)",
        borderRadius: "var(--radius-md)",
        padding: "1.25rem 1.5rem",
        marginBottom: "1.5rem",
        position: "relative"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.45rem",
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          color: "var(--accent-red)",
          marginBottom: "0.35rem"
        }}>
          <Skull size={13} />
          <span>Plataforma de Inteligencia Narcocriminal & Puntos de Venta · José C. Paz (JCP)</span>
        </div>

        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem", lineHeight: 1.2, fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
          JOSÉ C. PAZ — NARCOCRIMINALIDAD & DROGAS ILÍCITAS 911
        </h2>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
          Georreferenciación de Búnkers, Redes de Expendio y Conflictividad Territorial
        </h3>

        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "880px", lineHeight: 1.5 }}>
          Consolidación y auditoría de <strong style={{ color: "var(--text-primary)" }}>1.770 denuncias vecinales del 911</strong> (989 despachos tipificados formalmente y 781 alertas rescatadas por filtrado semántico de relatos). Identifica búnkers y casillas, clasifica sustancias (cocaína, paco, marihuana), audita sospechosos por NLP e individualiza zonas con presencia de armamento para investigaciones y allanamientos judiciales.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderLeft: "4px solid var(--accent-pba-cyan)",
      borderRadius: "var(--radius-md)",
      padding: "1.25rem 1.5rem",
      marginBottom: "1.5rem",
      position: "relative"
    }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontFamily: "var(--font-mono)",
        color: "var(--accent-pba-cyan)",
        marginBottom: "0.35rem"
      }}>
        <Car size={13} />
        <span>Plataforma de Investigación e Inteligencia Relacional · Mar del Plata (MDQ)</span>
      </div>

      <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.3rem", lineHeight: 1.2, fontFamily: "var(--font-display)", letterSpacing: "-0.015em" }}>
        MAR DEL PLATA — SUSTRACCIÓN AUTOMOTOR & DELITO CALIFICADO 911
      </h2>
      <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.6rem" }}>
        Descubrimiento de Relaciones Ocultas, Vinculación de Dominios y Modus Operandi
      </h3>

      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "880px", lineHeight: 1.5 }}>
        Herramienta investigativa enfocada en <strong style={{ color: "var(--text-primary)" }}>extraer valor relacional a partir de 8.598 eventos del 911</strong>. Conecta denuncias de robo con hallazgos mediante NLP de dominios, analiza patrones de uso de armamento y reconstruye la cronología de operación de bandas en General Pueyrredón.
      </p>
    </div>
  );
}

