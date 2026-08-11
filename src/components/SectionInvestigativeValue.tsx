import React from "react";
import { Search, Link, GitMerge, FileSearch, ShieldAlert, Cpu, CheckCircle2 } from "lucide-react";

export default function SectionInvestigativeValue() {
  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>🔍 Investigación de Patrones Relacionales y Complejidad Delictiva</span>
        </div>
        <p className="card-subtitle">
          Análisis forense de datos e inteligencia relacional para descubrir vínculos ocultos entre denuncias, hallazgos y modus operandi en Mar del Plata.
        </p>

        {/* 4 Investigative Findings Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-indigo)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <Link size={20} />
              <span>1. Trazabilidad de Vehículos (Cruce de Patentes)</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Se identificaron <strong style={{ color: "var(--text-primary)" }}>58 vehículos robados efectivamente vinculados con su hallazgo</strong> mediante minería de relatos 911. La mediana de abandono es de **4,9 horas para autos**, revelando su empleo como vehículo de apoyo temporal en otros ilícitos.
            </p>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-green)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <GitMerge size={20} />
              <span>2. Solapamiento Táctico (Armas vs Disparos)</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Existe un <strong style={{ color: "var(--text-primary)" }}>solapamiento directo de 67 IDs de despacho entre `ARMA DE FUEGO` y `DISPAROS PERSONAS`</strong>, permitiendo investigar la escalada del delito violento y la presencia recurrente de armamento en enfrentamientos territoriales.
            </p>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(6,182,212,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-cyan)", fontWeight: 700, marginBottom: "0.6rem" }}>
              <FileSearch size={20} />
              <span>3. Desguace vs Abandono de Apoyo</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              El desbalance entre hallazgos de autos (**64.9%**) y motos (**19.7%**) revela un patrón investigativo clave: **las motos ingresan inmediatamente a circuitos clandestinos de despiece**, mientras que los automóviles reaparecen abandonados en la vía pública.
            </p>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#8b5cf6", fontWeight: 700, marginBottom: "0.6rem" }}>
              <ShieldAlert size={20} />
              <span>4. Preferencia por Marcas y Nodos de Fuga</span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Las bandas muestran fijación en marcas de alta rotación: <strong style={{ color: "var(--text-primary)" }}>Honda (400) y Zanella (195) en ciclomotores; Fiat (171) y Peugeot (145) en autos</strong>, operando en corredores de salida periurbanos específicos.
            </p>
          </div>
        </div>

        {/* Relational Investigation Table */}
        <div className="card-title" style={{ fontSize: "1rem", marginBottom: "0.8rem" }}>
          Matriz de Correlación e Hipótesis Investigativas
        </div>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vínculo Investigado</th>
                <th>Patrón de Datos Hallado</th>
                <th>Hipótesis / Relación Descubierta</th>
                <th>Evidencia Forense</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Robo → Hallazgo Automotor</strong></td>
                <td>Abandono promedio en 4.9 hs</td>
                <td>Uso del automóvil robado como "unidad de apoyo/fuga" efímera</td>
                <td>58 patentes cruzadas en relatos 911</td>
              </tr>
              <tr>
                <td><strong>Robo → Motocicletas</strong></td>
                <td>Baja tasa de hallazgo (19.7%)</td>
                <td>Ingreso inmediato a redes de desguace y venta de repuestos</td>
                <td>400 robos concentrados en marca Honda</td>
              </tr>
              <tr>
                <td><strong>Violencia → Armas de Fuego</strong></td>
                <td>67 IDs coincidentes en despacho</td>
                <td>Escalada de violencia en áreas de disputa territorial urbana</td>
                <td>Solapamiento entre Armas y Disparos a Personas</td>
              </tr>
              <tr>
                <td><strong>Nocturnidad → Concentración</strong></td>
                <td>39.5% de incidentes entre 18 y 24 hs</td>
                <td>Sincronización horaria de bandas dedicadas a sustracción vehicular</td>
                <td>Pico de 185 robos/hora a las 20:00 hs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
