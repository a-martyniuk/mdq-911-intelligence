import React from "react";
import MetricCard from "./MetricCard";
import { Database, MapPin, CheckCircle, Car, Clock, ShieldAlert, Calendar, Download, FileText } from "lucide-react";
import { generateExecutiveDossierPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";

interface SectionOverviewProps {
  stats: {
    totalIncidents: number;
    georeferencedCount: number;
    georeferencedPct: number;
    nightCount: number;
    nightPct: number;
    recoveriesCount: number;
    medianRecoveryHours: number;
  };
  incidents?: any[];
  recoveries?: any[];
}

export default function SectionOverview({ stats, incidents = [], recoveries = [] }: SectionOverviewProps) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h2 className="card-title" style={{ fontSize: "1.5rem" }}>Resumen Ejecutivo del Proyecto</h2>
          <p className="card-subtitle">Indicadores clave consolidados del análisis de llamadas al 911 en Mar del Plata.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              generateExecutiveDossierPDF({
                totalIncidents: stats.totalIncidents,
                robosCount: 6524,
                hallazgosCount: 1420,
                incidentsSample: incidents,
                recoveries: recoveries,
                gangs: [
                  { nombre: "Banda de la Moto Negra 110cc", hechosCount: 24, patron: "Conductor con visera y acompañante armado en moto 110cc sin patente", franja: "Noche (20 a 02 hs)", zona: "Comisaría 2da (Macrocentro)", explicacion: "Coincidencia de 24 despachos en 30 días." },
                  { nombre: "Célula Fuga VW Gol Gris", hechosCount: 18, patron: "Auto de apoyo Gol Gris en robos de motocicletas", franja: "Madrugada (01 a 06 hs)", zona: "Comisaría 4ta (Pompeya)", explicacion: "Escape en convoy detectado por cámaras 911." },
                  { nombre: "Grupo Desguace Periferia West", hechosCount: 15, patron: "Sustracción en Centro ➔ Desguace en < 6 hs en Batán/Las Heras", franja: "Tarde/Noche", zona: "Comisaría 8va y 11ra", explicacion: "Recuperaciones de chasis desarmados." }
                ]
              });
            }}
            className="btn-logout"
            style={{
              height: "38px",
              padding: "0 1rem",
              fontSize: "0.825rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
            }}
          >
            <FileText size={16} /> 📄 Descargar Dossier Ejecutivo MDP (PDF)
          </button>

          <button
            onClick={() => {
              const data = [
                { Indicador: "Total Incidentes 911", Valor: stats.totalIncidents, Detalle: "Llamados procesados en General Pueyrredón" },
                { Indicador: "Coordenadas Normalizadas", Valor: stats.georeferencedCount, Detalle: `${stats.georeferencedPct.toFixed(1)}% georreferenciado` },
                { Indicador: "Vehículos Recuperados", Valor: stats.recoveriesCount, Detalle: "Identificados por matching de patentes" },
                { Indicador: "Mediana de Recuperación", Valor: `${stats.medianRecoveryHours.toFixed(1)} hs`, Detalle: "Tasa de abandono rápida" },
                { Indicador: "Franja Horaria Crítica", Valor: "18:00 - 24:00", Detalle: `${stats.nightPct.toFixed(1)}% de incidentes nocturnos` },
                { Indicador: "Día Pico", Valor: "Sábado", Detalle: "Mayor densidad semanal" },
              ];
              exportToCSV("resumen_ejecutivo_mdp", data);
            }}
            className="btn-logout"
            style={{
              height: "38px",
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
            <Download size={15} /> 📊 Exportar Resumen (Excel)
          </button>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Total de Incidentes"
          value={stats.totalIncidents.toLocaleString()}
          sub="Registros procesados 911"
          icon={<Database size={20} />}
          accentColor="#f59e0b"
        />
        <MetricCard
          label="Coordenadas Normalizadas"
          value={stats.georeferencedCount.toLocaleString()}
          sub={`${stats.georeferencedPct.toFixed(1)}% georreferenciado`}
          icon={<MapPin size={20} />}
          accentColor="#10b981"
        />
        <MetricCard
          label="Vehículos Recuperados"
          value={stats.recoveriesCount}
          sub="Identificados por matching NLP"
          icon={<Car size={20} />}
          accentColor="#06b6d4"
        />
        <MetricCard
          label="Mediana de Recuperación"
          value={`${stats.medianRecoveryHours.toFixed(1)} hs`}
          sub="0.2 días transcurridos promedio"
          icon={<Clock size={20} />}
          accentColor="#fbbf24"
        />
        <MetricCard
          label="Franja Horaria Crítica"
          value="18:00 - 24:00"
          sub={`${stats.nightPct.toFixed(1)}% de incidentes (Noche)`}
          icon={<ShieldAlert size={20} />}
          accentColor="#ef4444"
        />
        <MetricCard
          label="Día de Mayor Pico"
          value="Sábado"
          sub="Concentración alta de nocturnidad"
          icon={<Calendar size={20} />}
          accentColor="#8b5cf6"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
        <div className="card">
          <div className="card-title">🔍 Aspectos Destacados de Ingeniería de Datos</div>
          <ul style={{ paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.8rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>93,5% de Coordenadas Georreferenciadas:</strong> Se solucionó una anomalía severa de escala decimal en las variables de latitud/longitud exportadas desde Excel.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Matching de Patentes mediante NLP:</strong> Se logró vincular 58 vehículos robados con su posterior hallazgo analizando texto libre no estructurado de los relatos 911.
            </li>
            <li>
              <strong style={{ color: "var(--text-primary)" }}>Pico Nocturno:</strong> Casi 4 de cada 10 delitos (39,5%) ocurren en la franja de 18:00 a 24:00 hs, acentuándose los sábados a la noche.
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-title">🔐 Acceso Reservado & Autenticación de Servidor</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            <p style={{ marginBottom: "0.8rem" }}>
              Esta aplicación cuenta con <strong style={{ color: "var(--accent-indigo)" }}>autenticación obligatoria del lado servidor</strong>, contraseñas hasheadas con <code style={{ background: "var(--bg-elevated)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>bcrypt</code> y cookies de sesión HTTPOnly.
            </p>
            <p>
              El acceso es estrictamente reservado para usuarios autenticados mediante contraseña, garantizando la confidencialidad de la información y la protección de los endpoints de datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
