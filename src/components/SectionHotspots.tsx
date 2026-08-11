"use client";

import React, { useState } from "react";
import { Flame, Info, Layers } from "lucide-react";

export default function SectionHotspots() {
  const [activeTab, setActiveTab] = useState<"general" | "robos" | "armas">("general");

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>🔥 Hotspots Delictivos (Mapas de Densidad Espacial)</span>
        </div>
        <p className="card-subtitle">
          Análisis de Kernel Density Estimation (KDE) ajustado para identificar concentraciones delictivas urbanas sin saturación.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <button
            className={`btn-logout ${activeTab === "general" ? "active" : ""}`}
            style={activeTab === "general" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setActiveTab("general")}
          >
            <Flame size={16} /> Hotspots General
          </button>
          <button
            className={`btn-logout ${activeTab === "robos" ? "active" : ""}`}
            style={activeTab === "robos" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setActiveTab("robos")}
          >
            <Layers size={16} /> Robos de Autos/Motos
          </button>
          <button
            className={`btn-logout ${activeTab === "armas" ? "active" : ""}`}
            style={activeTab === "armas" ? { background: "var(--accent-indigo)", color: "#fff", borderColor: "var(--accent-indigo)" } : undefined}
            onClick={() => setActiveTab("armas")}
          >
            <Flame size={16} /> Disparos y Armas de Fuego
          </button>
        </div>

        <div style={{ background: "var(--bg-base)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
          {activeTab === "general" && (
            <iframe
              src="/api/raw_html/05_mapa_hotspots_densidad.html"
              style={{ width: "100%", height: "650px", border: "none" }}
              title="Hotspots General"
            />
          )}
          {activeTab === "robos" && (
            <iframe
              src="/api/raw_html/05_mapa_hotspots_robos.html"
              style={{ width: "100%", height: "650px", border: "none" }}
              title="Hotspots Robos"
            />
          )}
          {activeTab === "armas" && (
            <iframe
              src="/api/raw_html/05_mapa_hotspots_armas_disparos.html"
              style={{ width: "100%", height: "650px", border: "none" }}
              title="Hotspots Armas"
            />
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ gap: "0.5rem" }}>
          <Info size={20} color="var(--accent-indigo)" />
          <span>Explicación Metodológica: Estimación de Densidad por Kernel (KDE)</span>
        </div>
        <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <p style={{ marginBottom: "0.75rem" }}>
            La **Estimación de Densidad por Kernel (KDE)** es un método no paramétrico para estimar la función de densidad de probabilidad de una variable aleatoria espacial continua (coordenadas geográficas).
          </p>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Radio de Cobertura ($r=5$ px):</strong> Para evitar la sobre-saturación de la ciudad (mancha uniforme amarilla), se ajustó un ancho de banda ajustado que aísla los corredores viales e intersecciones con picos delictivos reales.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Transparencia Ajustada (65%):</strong> Permite visualizar simultáneamente el mapa base urbano de CartoDB (calles, avenidas y barrios) debajo de las iso-curvas de densidad.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
