import React from "react";
import { Search, Link, GitMerge, FileSearch, ShieldAlert, Cpu, CheckCircle2, Download, FileText } from "lucide-react";
import { generateExecutiveDossierPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";

export default function SectionInvestigativeValue() {
  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <div className="card-title">
              <span>🔍 Investigación de Patrones Relacionales y Complejidad Delictiva</span>
            </div>
            <p className="card-subtitle">
              Análisis forense de datos e inteligencia relacional para descubrir vínculos ocultos entre denuncias, hallazgos y modus operandi en Mar del Plata.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateExecutiveDossierPDF({
                  totalIncidents: 8598,
                  robosCount: 6524,
                  hallazgosCount: 1420,
                  gangs: [
                    { nombre: "Banda de la Moto Negra 110cc", hechosCount: 24, patron: "Conductor con visera y acompañante armado en moto 110cc", franja: "Noche (20 a 02 hs)", zona: "Comisaría 2da (Macrocentro)", explicacion: "Coincidencia de 24 despachos en 30 días." },
                    { nombre: "Célula Fuga VW Gol Gris", hechosCount: 18, patron: "Auto de apoyo Gol Gris en robos de motovehículos", franja: "Madrugada (01 a 06 hs)", zona: "Comisaría 4ta (Pompeya)", explicacion: "Escape coordinado por avenidas principales." },
                    { nombre: "Grupo Desguace Periferia West", hechosCount: 15, patron: "Sustracción en Centro ➔ Desguace en < 6 hs en Batán/Las Heras", franja: "Tarde/Noche", zona: "Comisaría 8va y 11ra", explicacion: "Recupero de chasis desguazados." }
                  ]
                });
              }}
              className="btn-logout"
              style={{
                height: "36px",
                padding: "0 1rem",
                fontSize: "0.8rem",
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
              <FileText size={15} /> 📄 Descargar Dossier Ejecutivo Forense (PDF)
            </button>

            <button
              onClick={() => {
                const exportData = [
                  { Vinculo: "Robo ➔ Hallazgo Automotor", Patron: "Abandono promedio en 4.9 hs", Hipotesis: "Uso del auto robado como unidad de apoyo/fuga efímera", Evidencia: "58 patentes cruzadas en relatos 911" },
                  { Vinculo: "Robo ➔ Motocicletas", Patron: "Baja tasa de hallazgo (19.7%)", Hipotesis: "Ingreso inmediato a redes de desguace y venta de repuestos", Evidencia: "400 robos concentrados en Honda" },
                  { Vinculo: "Violencia ➔ Armas de Fuego", Patron: "67 IDs coincidentes en despacho", Hipotesis: "Escalada de violencia en áreas de disputa territorial", Evidencia: "Solapamiento entre Armas y Disparos" },
                  { Vinculo: "Nocturnidad ➔ Concentración", Patron: "39.5% de incidentes entre 18 y 24 hs", Hipotesis: "Sincronización horaria de bandas dedicadas a sustracción", Evidencia: "Pico de 185 robos/hora a las 20:00 hs" },
                  { Vinculo: "Descarte ➔ Asentamientos RENABAP", Patron: "82.7% de hallazgos a < 350m", Hipotesis: "Zonas de enfriamiento y transbordo periférico", Evidencia: "Cruce espacial con Polígonos SISU RENABAP" }
                ];
                exportToCSV("matriz_hipotesis_investigacion_forense", exportData);
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
              <Download size={15} /> 📊 Exportar Hipótesis (Excel)
            </button>
          </div>
        </div>

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

        {/* Highlight Banner: 82.7% RENABAP Spatial Correlation */}
        <div style={{ background: "linear-gradient(135deg, rgba(234,88,12,0.12) 0%, rgba(249,115,22,0.05) 100%)", border: "1px solid rgba(234,88,12,0.4)", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ea580c", fontWeight: 800, fontSize: "1rem", marginBottom: "0.5rem" }}>
            <ShieldAlert size={22} />
            <span>🔥 Hallazgo Clave: Correlación Espacial RENABAP & Zonas de Enfriamiento (82.7%)</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
            Al superponer los 124 barrios oficiales y los 14 asentamientos vulnerables del <strong>RENABAP (Registro Nacional de Barrios Populares - SISU)</strong> (<i>La Herradura, Belisario Roldán, Autódromo, Las Heras, Don Emilio / Parque Palermo, El Martillo, Monolito, San Antonio, Félix U. Camet, etc.</i>) con las trayectorias de sustracción y hallazgo:
          </p>
          <div style={{ background: "rgba(0,0,0,0.25)", padding: "0.85rem", borderRadius: "6px", borderLeft: "4px solid #ea580c", fontSize: "0.9rem", color: "#fdba74", fontWeight: 700, marginBottom: "0.6rem" }}>
            🎯 82.7% de los hallazgos/descartes periféricos de automóviles y motovehículos robados en el Macrocentro ocurren dentro o en un radio menor a 350 metros del perímetro de estos asentamientos RENABAP.
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            <strong>👮 APORTE POLICIAL EMPÍRICO:</strong> Confirma cuantitativamente que los asentamientos periféricos son utilizados por las bandas delictivas seriales como <strong>zonas primarias de enfriamiento de vehículos, desguace rápido de motovehículos (menor a 6 horas) o punto de transbordo a vehículos de apoyo</strong>.
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
