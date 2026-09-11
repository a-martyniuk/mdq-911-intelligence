"use client";

import React from "react";
import MetricCard from "./MetricCard";
import { ShieldAlert, AlertOctagon, MapPin, Skull, Flame, Crosshair, Home, Award, Download, FileText } from "lucide-react";
import { generateDrogasJcpPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";

interface SectionDrogasOverviewProps {
  stats: {
    totalIncidents: number;
    georeferencedCount: number;
    georeferencedPct: number;
    armasCount: number;
    armasPct: number;
    cocainaCount: number;
    marihuanaCount: number;
    pacoCount: number;
  };
  incidents?: any[];
}

export default function SectionDrogasOverview({ stats, incidents = [] }: SectionDrogasOverviewProps) {
  const jcpOnlyIncidents = React.useMemo(() => {
    return incidents.filter((i: any) => {
      const p = (i.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;
      return true;
    });
  }, [incidents]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem" }}>
            💊 Inteligencia Narcocriminal & Puntos de Venta (José C. Paz)
          </h2>
          <p className="card-subtitle">
            Consolidación de denuncias 911 sobre comercialización de estupefacientes, búnkers territoriales y conflictividad armada en el Partido de José C. Paz.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => generateDrogasJcpPDF({ ...stats, incidents: jcpOnlyIncidents })}
            className="btn-logout"
            style={{
              height: "36px",
              padding: "0 0.9rem",
              fontSize: "0.8rem",
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.02em",
              background: "#991b1b",
              color: "#fff",
              border: "1px solid var(--accent-red)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <FileText size={15} /> 📄 Informe Ejecutivo JCP (PDF)
          </button>

          <button
            onClick={() => {
              const data = [
                { Indicador: "Total Denuncias 911", Valor: stats.totalIncidents, Detalle: "Llamados por comercialización de drogas" },
                { Indicador: "Georreferenciación Válida", Valor: stats.georeferencedCount, Detalle: `${stats.georeferencedPct.toFixed(1)}% georreferenciado en JCP` },
                { Indicador: "Conflictividad con Armas", Valor: stats.armasCount, Detalle: `${stats.armasPct.toFixed(1)}% con armas o disparos` },
                { Indicador: "Puntos de Cocaína", Valor: stats.cocainaCount, Detalle: "Mención directa o combinada" },
                { Indicador: "Puntos de Marihuana", Valor: stats.marihuanaCount, Detalle: "Venta / acopio verificado en relato" },
                { Indicador: "Focos de Paco / Pasta Base", Valor: stats.pacoCount, Detalle: "Zonas de alto deterioro social" }
              ];
              exportToCSV("indicadores_narcocriminalidad_jcp", data);
            }}
            className="btn-logout"
            style={{
              height: "36px",
              padding: "0 0.9rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Download size={15} /> 📊 Exportar Indicadores (Excel)
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Total Denuncias 911"
          value={stats.totalIncidents.toLocaleString()}
          sub="Llamados por comercialización de drogas"
          icon={<AlertOctagon size={20} />}
          accentColor="#ef4444"
        />
        <MetricCard
          label="Georreferenciación Válida"
          value={stats.georeferencedCount.toLocaleString()}
          sub={`${stats.georeferencedPct.toFixed(1)}% georreferenciado en JCP`}
          icon={<MapPin size={20} />}
          accentColor="#10b981"
        />
        <MetricCard
          label="Conflictividad con Armas"
          value={stats.armasCount.toLocaleString()}
          sub={`${stats.armasPct.toFixed(1)}% con armas o disparos`}
          icon={<Crosshair size={20} />}
          accentColor="#dc2626"
        />
        <MetricCard
          label="Puntos de Cocaína"
          value={stats.cocainaCount.toLocaleString()}
          sub="Mención directa o combinada"
          icon={<Skull size={20} />}
          accentColor="#f59e0b"
        />
        <MetricCard
          label="Puntos de Marihuana"
          value={stats.marihuanaCount.toLocaleString()}
          sub="Venta / acopio verificado en relato"
          icon={<Flame size={20} />}
          accentColor="#8b5cf6"
        />
        <MetricCard
          label="Focos de Paco / Pasta Base"
          value={stats.pacoCount.toLocaleString()}
          sub="Zonas de alto deterioro social"
          icon={<ShieldAlert size={20} />}
          accentColor="#ec4899"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div className="card">
          <div className="card-title">🔍 Patrones Delictuales Detectados en Relatos 911</div>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Búnkers, Casillas y Baldíos Ocupados:</strong> Frecuente reporte de casillas de chapa, baldíos tomados con cercos improvisados y "ventanitas" de expendio continuo con guardias permanentes.
            </li>
            <li>
              <strong style={{ color: "#ef4444" }}>Presencia Extensiva de Armamento (77,3%):</strong> Alto índice de denuncias que reportan tiroteos al aire, intimidaciones vecinales y "soldaditos" armados custodiando las esquinas.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Economía del Delito y Canje por Robos:</strong> Múltiples alertas señalan el intercambio directo de bienes sustraídos (bicicletas, celulares, herramientas) por dosis de estupefacientes en los puntos de venta.
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">⚖️ Utilidad Operativa para Investigaciones & Allanamientos</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            <p style={{ marginBottom: "0.8rem" }}>
              Este módulo permite a las fiscalías especializadas en Estupefacientes y a las fuerzas de seguridad cruzar llamadas anónimas repetitivas sobre una misma ubicación, identificando la <strong>reincidencia espacial y temporal</strong> de puntos de venta activos.
            </p>
            <p>
              La normalización de coordenadas y el análisis NLP de alias habilitan la fundamentación pericial requerida para <strong>órdenes de allanamiento y desbaratamiento de búnkers</strong>.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-title">🏙️ Distribución Territorial por Barrio</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { loc: "Sol y Verde", pct: 3.2, color: "#ef4444" },
              { loc: "Vucetich / Salvatori", pct: 1.5, color: "#f59e0b" },
              { loc: "Barrio Frino", pct: 1.0, color: "#8b5cf6" },
              { loc: "Barrio La Paz", pct: 1.0, color: "#3b82f6" },
              { loc: "Barrio Lamas", pct: 0.8, color: "#10b981" },
              { loc: "San Atilio / Alberdi", pct: 1.0, color: "#06b6d4" },
              { loc: "José C. Paz (Centro / General)", pct: 91.1, color: "#64748b" },
            ].map((item) => (
              <div key={item.loc}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "2px" }}>
                  <span style={{ color: "var(--text-secondary)" }}>{item.loc}</span>
                  <span style={{ fontWeight: 700, color: item.color }}>{item.pct}%</span>
                </div>
                <div style={{ background: "var(--bg-base)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{ width: `${item.pct}%`, height: "100%", background: item.color, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">🗓️ Cobertura Temporal & Fuentes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { label: "Período", value: "Ene – Ago 2026" },
              { label: "Drogas Ilícitas Formales", value: "989 hechos" },
              { label: "Info Vecinal (Relatos)", value: "781 alertas" },
              { label: "Duplicados Eliminados", value: "1 (ID coincidente)" },
              { label: "Cobertura Geo", value: "99.6%" },
              { label: "Con Armas Reportadas", value: "77.3%" },
            ].map((item) => (
              <div key={item.label} style={{ background: "var(--bg-base)", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
