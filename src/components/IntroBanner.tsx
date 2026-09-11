"use client";

import React from "react";
import { Car, Skull, Crosshair } from "lucide-react";

interface IntroBannerProps {
  currentProject?: "mdp" | "jcp" | "malvinas";
}

export default function IntroBanner({ currentProject = "mdp" }: IntroBannerProps) {
  if (currentProject === "malvinas") {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "12px", marginBottom: "0.25rem", fontWeight: 500 }}>
          <Crosshair size={13} style={{ color: "var(--accent-amber)" }} />
          <span>Inteligencia Narcocriminal & Puntos de Venta · Malvinas Argentinas</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.3rem 0", letterSpacing: "-0.01em" }}>
          Malvinas Argentinas — Narcocriminalidad & Puntos de Venta 911
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, maxWidth: "980px" }}>
          Consolidación de <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>1.471 denuncias 911</strong> (802 despachos formales y 669 alertas de relato). Cobertura del 98.6% georreferenciada en 6 localidades, auditando búnkers territoriales y focos de alta presencia de armamento (72.0%).
        </p>
      </div>
    );
  }

  if (currentProject === "jcp") {
    return (
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "12px", marginBottom: "0.25rem", fontWeight: 500 }}>
          <Skull size={13} style={{ color: "var(--accent-red)" }} />
          <span>Inteligencia Narcocriminal & Puntos de Venta · José C. Paz</span>
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.3rem 0", letterSpacing: "-0.01em" }}>
          José C. Paz — Narcocriminalidad & Drogas Ilícitas 911
        </h2>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, maxWidth: "980px" }}>
          Consolidación de <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>1.770 denuncias 911</strong> (989 despachos formales y 781 alertas vecinales). Identificación de búnkers y casillas, clasificación de sustancias e individualización de zonas de conflictividad armada.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "0.85rem 1.25rem",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "12px", marginBottom: "0.25rem", fontWeight: 500 }}>
        <Car size={13} style={{ color: "var(--accent-pba-cyan)" }} />
        <span>Investigación e Inteligencia Relacional · General Pueyrredón</span>
      </div>
      <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.3rem 0", letterSpacing: "-0.01em" }}>
        Mar del Plata — Sustracción Automotor & Delito Calificado 911
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, maxWidth: "980px" }}>
        Análisis relacional sobre <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>8.598 eventos del 911</strong>. Vinculación de robos con hallazgos mediante NLP de dominios, análisis de patrones de armamento y reconstrucción cronológica de bandas delictivas.
      </p>
    </div>
  );
}

