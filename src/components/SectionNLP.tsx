"use client";

import React, { useState } from "react";
import MetricCard from "./MetricCard";
import { FileText, Cpu, Search, Sparkles } from "lucide-react";

export default function SectionNLP() {
  const [sampleText, setSampleText] = useState(
    "11 INF OF MERLO - HURTO ZANELLA 110 2020 YAPEYU 570 - COLOR AZUL CALCOMANIA DE RIVER - DOM A115NAU - DENUNCIANTE G.A.C."
  );

  const patenteRegex = /\b([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{1}\d{3}[A-Z]{3}|[A-Z]{3}\d{3}|\d{3}[A-Z]{3})\b/gi;
  const marcas = ["ZANELLA", "GILERA", "HONDA", "YAMAHA", "MOTOMEL", "CHEVROLET", "FORD", "FIAT", "VOLKSWAGEN", "RENAULT"];

  const foundPatentes = Array.from(new Set((sampleText.match(patenteRegex) || []).map((p) => p.toUpperCase())));
  const foundMarca = marcas.find((m) => new RegExp(`\\b${m}\\b`, "i").test(sampleText)) || "NO DETECTADA";

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>📝 Procesamiento de Lenguaje Natural (NLP) sobre Relatos 911</span>
        </div>
        <p className="card-subtitle">
          Transformación de relatos telefónicos no estructurados en variables analíticas estructuradas (patentes, marcas vehiculares y entidades de seguridad).
        </p>

        {/* NLP Flowchart */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          background: "var(--bg-base)",
          padding: "1.25rem",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          marginBottom: "1.5rem"
        }}>
          {["Relato 911 Libre", "Limpieza & Uppercase", "Regex Patentes & Marcas", "Extracción Entidades", "Cross-Matching"].map((step, idx) => (
            <React.Fragment key={step}>
              <div style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-accent)",
                borderRadius: "var(--radius-sm)",
                padding: "0.6rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--accent-indigo)",
                textAlign: "center"
              }}>
                {step}
              </div>
              {idx < 4 && <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>→</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="metric-grid">
          <MetricCard
            label="Relatos con Patente"
            value="4.207"
            sub="37,7% de cobertura en robos"
            icon={<FileText size={20} />}
            accentColor="#f59e0b"
          />
          <MetricCard
            label="Patentes Únicas Extraídas"
            value="1.540"
            sub="Formatos Mercosur y Tradicional"
            icon={<Cpu size={20} />}
            accentColor="#10b981"
          />
          <MetricCard
            label="Marcas Detectadas"
            value="24 Marcas"
            sub="Zanella, Gilera, Honda, Chevrolet..."
            icon={<Search size={20} />}
            accentColor="#06b6d4"
          />
        </div>

        {/* Interactive NLP Tester */}
        <div style={{ background: "var(--bg-base)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.5rem", gap: "0.4rem" }}>
            <Sparkles size={18} color="var(--accent-pink)" />
            <span>Probador Interactivo de Extracción NLP</span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Ingresa o modifica un texto de relato policial para probar en tiempo real la extracción de patentes y marcas:
          </p>

          <textarea
            className="form-input"
            rows={3}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            style={{ fontFamily: "monospace", fontSize: "0.85rem", marginBottom: "1rem" }}
          />

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Patentes Detectadas</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-indigo)", marginTop: "0.2rem" }}>
                {foundPatentes.length > 0 ? foundPatentes.join(", ") : "Ninguna patente hallada"}
              </div>
            </div>

            <div style={{ flex: 1, background: "var(--bg-surface)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Marca de Vehículo</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent-green)", marginTop: "0.2rem" }}>
                {foundMarca}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
