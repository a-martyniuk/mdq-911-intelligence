"use client";

import React from "react";
import MetricCard from "./MetricCard";
import { ShieldAlert, AlertOctagon, MapPin, Skull, Flame, Crosshair, Download, FileText } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasMalvinasPDF } from "@/lib/pdfReport";

interface SectionMalvinasOverviewProps {
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

export default function SectionMalvinasOverview({ stats, incidents = [] }: SectionMalvinasOverviewProps) {
  const malvinasOnlyIncidents = React.useMemo(() => {
    return incidents.filter((i: any) => {
      const p = (i.partido || "").toUpperCase();
      if (p.includes("JOSÉ") || p.includes("JOSE") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return false;
      const lat = Number(i.lat ?? i.Latitud_Clean ?? i.Latitud);
      if (!isNaN(lat) && lat < -34.535) return false;
      return true;
    });
  }, [incidents]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem" }}>
            💊 Inteligencia Narcocriminal &amp; Puntos de Venta (Malvinas Argentinas)
          </h2>
          <p className="card-subtitle">
            Consolidación de 1.471 denuncias 911 sobre comercialización de estupefacientes, búnkers territoriales y conflictividad armada en las seis localidades del Partido de Malvinas Argentinas (Ene–Ago 2026).
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => generateDrogasMalvinasPDF({ ...stats, incidents: malvinasOnlyIncidents })}
            className="btn-logout"
            style={{
              height: "38px",
              padding: "0 1rem",
              fontSize: "0.825rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 8px rgba(245,158,11,0.3)"
            }}
          >
            <FileText size={16} /> 📄 Descargar Informe Ejecutivo Malvinas (PDF)
          </button>

          <button
            onClick={() => {
              exportToCSV("indicadores_narcocriminalidad_malvinas", [
                { Indicador: "Total Denuncias 911", Valor: stats.totalIncidents },
                { Indicador: "Georreferenciación Válida", Valor: stats.georeferencedCount },
                { Indicador: "Conflictividad con Armas", Valor: stats.armasCount },
                { Indicador: "Puntos de Cocaína", Valor: stats.cocainaCount },
                { Indicador: "Puntos de Marihuana", Valor: stats.marihuanaCount },
                { Indicador: "Focos de Paco", Valor: stats.pacoCount },
              ]);
            }}
            className="btn-logout"
            style={{ height: "38px", padding: "0 0.9rem", fontSize: "0.8rem", fontWeight: 700, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Download size={15} /> 📊 Exportar Indicadores
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total Denuncias 911" value={stats.totalIncidents.toLocaleString()} sub="Llamados por comercialización de drogas" icon={<AlertOctagon size={20} />} accentColor="#ef4444" />
        <MetricCard label="Georreferenciación Válida" value={stats.georeferencedCount.toLocaleString()} sub={`${stats.georeferencedPct.toFixed(1)}% georreferenciado`} icon={<MapPin size={20} />} accentColor="#10b981" />
        <MetricCard label="Conflictividad con Armas" value={stats.armasCount.toLocaleString()} sub={`${stats.armasPct.toFixed(1)}% con armas o disparos`} icon={<Crosshair size={20} />} accentColor="#dc2626" />
        <MetricCard label="Puntos de Cocaína" value={stats.cocainaCount.toLocaleString()} sub="Mención directa o combinada" icon={<Skull size={20} />} accentColor="#f59e0b" />
        <MetricCard label="Puntos de Marihuana" value={stats.marihuanaCount.toLocaleString()} sub="Venta / acopio verificado en relato" icon={<Flame size={20} />} accentColor="#8b5cf6" />
        <MetricCard label="Focos de Paco / Pasta Base" value={stats.pacoCount.toLocaleString()} sub="Zonas de alto deterioro social" icon={<ShieldAlert size={20} />} accentColor="#ec4899" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div className="card">
          <div className="card-title">🔍 Patrones Delictuales en Relatos 911</div>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            <li><strong style={{ color: "var(--text-primary)" }}>Alta Fragmentación Territorial (6 Localidades):</strong> Grand Bourg concentra el 33% del total. Los corredores de Ruta 8 y Ruta 197 son ejes de distribución y escape hacia el conurbano noroeste.</li>
            <li><strong style={{ color: "#ef4444" }}>Presencia Extensa de Armamento (72%):</strong> Alta tasa de hechos con armas o disparos, con particular concentración en la zona de Grand Bourg y la frontera con José C. Paz.</li>
            <li><strong style={{ color: "var(--text-primary)" }}>55% Polirubro Sin Sustancia Declarada:</strong> Los denunciantes perciben la actividad (bultos, movimiento de personas, guardias armadas) sin identificar el producto, patrón típico de zonas de alta intimidación vecinal.</li>
          </ul>
        </div>
        <div className="card">
          <div className="card-title">⚖️ Utilidad Operativa para Investigaciones</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            <p style={{ marginBottom: "0.8rem" }}>Este módulo permite cruzar llamadas anónimas repetitivas sobre una misma ubicación, identificando la <strong>reincidencia espacial y temporal</strong> de puntos de venta activos en las seis localidades.</p>
            <p>La georeferenciación del <strong>98.6% de los hechos</strong> (1.451 de 1.471) garantiza validez cartográfica para presentaciones judiciales y planes de saturación perimetral con las 4 comisarías del partido.</p>
          </div>
        </div>
        <div className="card">
          <div className="card-title">🏙️ Distribución por Localidad</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { loc: "Grand Bourg", pct: 33.4, color: "#ef4444" },
              { loc: "Pablo Nogués", pct: 14.0, color: "#f59e0b" },
              { loc: "Tortuguitas", pct: 11.3, color: "#8b5cf6" },
              { loc: "Los Polvorines", pct: 10.5, color: "#3b82f6" },
              { loc: "Villa de Mayo", pct: 3.9, color: "#10b981" },
              { loc: "Adolfo Sourdeaux", pct: 3.5, color: "#06b6d4" },
              { loc: "Sin Localidad Asignada", pct: 23.4, color: "#64748b" },
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
          <div className="card-title">🗓️ Cobertura Temporal</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { label: "Período", value: "Ene – Ago 2026" },
              { label: "Drogas Ilícitas Formales", value: "802 hechos" },
              { label: "Info Vecinal (Relato)", value: "669 alertas" },
              { label: "Duplicados Eliminados", value: "0 (IDs únicos)" },
              { label: "Cobertura Geo", value: "98.6%" },
              { label: "Con Armas Reportadas", value: "72.0%" },
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
