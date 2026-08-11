import React from "react";
import MetricCard from "./MetricCard";
import { Database, MapPin, CheckCircle, Car, Clock, ShieldAlert, Calendar } from "lucide-react";

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
}

export default function SectionOverview({ stats }: SectionOverviewProps) {
  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 className="card-title" style={{ fontSize: "1.5rem" }}>Resumen Ejecutivo del Proyecto</h2>
        <p className="card-subtitle">Indicadores clave consolidados del análisis de llamadas al 911 en Mar del Plata.</p>
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
