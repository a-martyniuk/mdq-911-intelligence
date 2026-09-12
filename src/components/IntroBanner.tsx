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
        className="card animate-enter"
        style={{
          padding: "1rem 1.35rem",
          marginBottom: "1.25rem",
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderLeft: "4px solid #d97706",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: "1 1 600px", minWidth: "280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.72rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#b45309",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              padding: "2px 7px",
              borderRadius: "var(--radius-xs)"
            }}>
              <Crosshair size={12} />
              Malvinas Argentinas · UFI Drogas Ilícitas
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              PERIODO: 01/01/2026 – 31/08/2026
            </span>
          </div>
          <h2 style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.35rem 0", letterSpacing: "-0.015em" }}>
            Malvinas Argentinas — Narcocriminalidad & Puntos de Venta 911
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0, maxWidth: "980px" }}>
            Consolidación pericial de <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>1.471 denuncias 911</strong> (802 despachos formales y 669 alertas vecinales). Cobertura del 98.6% georreferenciada en 6 localidades, auditando búnkers y nodos de alta conflictividad armada (72.0%).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hechos 911</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>1.471</div>
          </div>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Georref</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>98.6%</div>
          </div>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasa Armas</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>72.0%</div>
          </div>
        </div>
      </div>
    );
  }

  if (currentProject === "jcp") {
    return (
      <div
        className="card animate-enter"
        style={{
          padding: "1rem 1.35rem",
          marginBottom: "1.25rem",
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderLeft: "4px solid #dc2626",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: "1 1 600px", minWidth: "280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.72rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "2px 7px",
              borderRadius: "var(--radius-xs)"
            }}>
              <Skull size={12} />
              José C. Paz · UFI Narcocriminalidad
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              PERIODO: 01/01/2026 – 31/08/2026
            </span>
          </div>
          <h2 style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.35rem 0", letterSpacing: "-0.015em" }}>
            José C. Paz — Narcocriminalidad & Drogas Ilícitas 911
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0, maxWidth: "980px" }}>
            Consolidación de <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>1.770 denuncias 911</strong> (989 despachos formales y 781 alertas vecinales). Identificación de búnkers y casillas, clasificación de sustancias e individualización de zonas de conflictividad armada.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hechos 911</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>1.770</div>
          </div>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Georref</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>99.6%</div>
          </div>
          <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasa Armas</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>77.3%</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card animate-enter"
      style={{
        padding: "1rem 1.35rem",
        marginBottom: "1.25rem",
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderLeft: "4px solid #0d5ca8",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
      }}
    >
      <div style={{ flex: "1 1 600px", minWidth: "280px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            fontSize: "0.72rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#0d5ca8",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            padding: "2px 7px",
            borderRadius: "var(--radius-xs)"
          }}>
            <Car size={12} />
            General Pueyrredón · Sustracción Automotores
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            PERIODO: 01/01/2026 – 05/08/2026
          </span>
        </div>
        <h2 style={{ fontSize: "19px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 0.35rem 0", letterSpacing: "-0.015em" }}>
          Mar del Plata — Sustracción Automotor & Delito Calificado 911
        </h2>
        <p style={{ fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.55, margin: 0, maxWidth: "980px" }}>
          Análisis relacional sobre <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>8.598 eventos del 911</strong>. Vinculación de robos con hallazgos mediante NLP de dominios, análisis de patrones de armamento y reconstrucción cronológica de bandas delictivas.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Eventos 911</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>8.598</div>
        </div>
        <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Recuperos NLP</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0d5ca8", fontFamily: "var(--font-mono)" }}>52</div>
        </div>
        <div style={{ padding: "6px 12px", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Georref</div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>93.0%</div>
        </div>
      </div>
    </div>
  );
}

