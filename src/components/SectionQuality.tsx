import React from "react";
import MetricCard from "./MetricCard";
import { CheckCircle2, AlertCircle, Database, MapPin, Download } from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";

export default function SectionQuality() {
  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title">
              <span>✅ Calidad y Transformación de Datos</span>
            </div>
            <p className="card-subtitle">
              Métricas de integridad, completitud y tasa de recuperación geográfica tras el pipeline de limpieza.
            </p>
          </div>

          <button
            onClick={() => {
              const exportData = [
                { Dataset: "ROBO AUTO-MOTO", Filas_Totales: 4207, Coordenadas_Validas: 3942, Pct_Georreferenciado: "93,7%", Nulos_Direccion: 12, Estado: "ÓPTIMO" },
                { Dataset: "HALLAZGO AUTOMOTOR", Filas_Totales: 2586, Coordenadas_Validas: 2421, Pct_Georreferenciado: "93,6%", Nulos_Direccion: 7, Estado: "ÓPTIMO" },
                { Dataset: "DISPAROS PERSONAS", Filas_Totales: 954, Coordenadas_Validas: 882, Pct_Georreferenciado: "92,5%", Nulos_Direccion: 1, Estado: "ÓPTIMO" },
                { Dataset: "ARMA DE FUEGO", Filas_Totales: 851, Coordenadas_Validas: 790, Pct_Georreferenciado: "92,8%", Nulos_Direccion: 1, Estado: "ÓPTIMO" },
              ];
              exportToCSV("auditoria_calidad_datos_mseg", exportData);
            }}
            className="btn-logout"
            style={{
              height: "36px",
              padding: "0 0.9rem",
              fontSize: "0.8rem",
              fontWeight: 700,
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}
          >
            <Download size={15} /> 📊 Exportar Matriz de Calidad (Excel)
          </button>
        </div>

        <div className="metric-grid">
          <MetricCard
            label="Registros Procesados"
            value="8.598"
            sub="100% de conservación de registros"
            icon={<Database size={20} />}
            accentColor="#10b981"
          />
          <MetricCard
            label="Cobertura Geográfica"
            value="93,5%"
            sub="8.035 coordenadas procesadas"
            icon={<MapPin size={20} />}
            accentColor="#f59e0b"
          />
          <MetricCard
            label="Éxito Reparación Decimal"
            value="99,7%"
            sub="Sobre coordenadas no nulas"
            icon={<CheckCircle2 size={20} />}
            accentColor="#06b6d4"
          />
          <MetricCard
            label="Variables Generadas"
            value="25 Campos"
            sub="10 originales + 15 derivadas"
            icon={<CheckCircle2 size={20} />}
            accentColor="#8b5cf6"
          />
        </div>

        {/* Quality Table Breakdown */}
        <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.8rem" }}>
          Matriz de Auditoría y Completitud por Archivo Fuente
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dataset</th>
                <th>Filas Totales</th>
                <th>Coordenadas Válidas</th>
                <th>% Georreferenciado</th>
                <th>Nulos en Dirección</th>
                <th>Estado Calidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ROBO AUTO-MOTO</strong></td>
                <td>4.207</td>
                <td>3.942</td>
                <td><strong style={{ color: "var(--accent-green)" }}>93,7%</strong></td>
                <td>12 (0,3%)</td>
                <td><span className="badge" style={{ color: "var(--accent-green)" }}>ÓPTIMO</span></td>
              </tr>
              <tr>
                <td><strong>HALLAZGO AUTOMOTOR</strong></td>
                <td>2.586</td>
                <td>2.421</td>
                <td><strong style={{ color: "var(--accent-green)" }}>93,6%</strong></td>
                <td>7 (0,3%)</td>
                <td><span className="badge" style={{ color: "var(--accent-green)" }}>ÓPTIMO</span></td>
              </tr>
              <tr>
                <td><strong>DISPAROS PERSONAS</strong></td>
                <td>954</td>
                <td>882</td>
                <td><strong style={{ color: "var(--accent-green)" }}>92,5%</strong></td>
                <td>1 (0,1%)</td>
                <td><span className="badge" style={{ color: "var(--accent-green)" }}>ÓPTIMO</span></td>
              </tr>
              <tr>
                <td><strong>ARMA DE FUEGO</strong></td>
                <td>851</td>
                <td>790</td>
                <td><strong style={{ color: "var(--accent-green)" }}>92,8%</strong></td>
                <td>1 (0,1%)</td>
                <td><span className="badge" style={{ color: "var(--accent-green)" }}>ÓPTIMO</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
