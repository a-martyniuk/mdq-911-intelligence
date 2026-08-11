"use client";

import React, { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { DictionaryItem } from "@/lib/types";

export default function SectionDictionary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"todas" | "original" | "derivada" | "recuperacion">("todas");

  const dictionaryData: DictionaryItem[] = [
    { campo: "ID", tipo: "int64", descripcion: "Identificador único de llamada / despacho del 911.", ejemplo: "10016459521", categoria: "original" },
    { campo: "Fecha", tipo: "datetime64", descripcion: "Fecha y hora exacta de recepción de la llamada.", ejemplo: "2026-08-05 23:31:00", categoria: "original" },
    { campo: "Dirección", tipo: "string", descripcion: "Esquina, calle o altura informada durante la llamada.", ejemplo: "BALCARCE y España", categoria: "original" },
    { campo: "Tipo", tipo: "string", descripcion: "Categoría primaria del incidente delictivo o emergencia.", ejemplo: "ROBO AUTOMOTOR, DISPAROS", categoria: "original" },
    { campo: "SubTipo", tipo: "string", descripcion: "Clasificación secundaria específica del incidente.", ejemplo: "MOTOS, VEHÍCULOS, PERSONAS", categoria: "original" },
    { campo: "Relato", tipo: "string", descripcion: "Transcripción de la llamada telefónica y observaciones del operador.", ejemplo: "LLAMANTE REFIERE QUE LE ROBARON LA MOTO...", categoria: "original" },
    { campo: "Partido asignado", tipo: "string", descripcion: "Municipio de jurisdicción policial asignado.", ejemplo: "GENERAL PUEYRREDON", categoria: "original" },
    { campo: "Localidad asignada", tipo: "string", descripcion: "Ciudad o localidad asignada en el mapeo.", ejemplo: "MAR DEL PLATA, BATAN", categoria: "original" },
    { campo: "Resultado", tipo: "string", descripcion: "Código de cierre otorgado al finalizar la intervención.", ejemplo: "POSITIVO, NEGATIVO, V ACC-MC", categoria: "original" },
    { campo: "Comentario Cierre Supervisor", tipo: "string", descripcion: "Nota aclaratoria ingresada por el supervisor de despacho.", ejemplo: "POSITIVO DATOS EN RELATO", categoria: "original" },
    
    { campo: "Latitud_Clean", tipo: "float64", descripcion: "Latitud geográfica corregida en grados decimales (Rango -38.25 a -37.75).", ejemplo: "-37.989958", categoria: "derivada" },
    { campo: "Longitud_Clean", tipo: "float64", descripcion: "Longitud geográfica corregida en grados decimales (Rango -57.75 a -57.35).", ejemplo: "-57.552129", categoria: "derivada" },
    { campo: "Año", tipo: "int64", descripcion: "Año de ocurrencia del incidente.", ejemplo: "2026", categoria: "derivada" },
    { campo: "Mes", tipo: "int64", descripcion: "Número ordinal del mes (1 al 12).", ejemplo: "8", categoria: "derivada" },
    { campo: "Mes_Nombre", tipo: "string", descripcion: "Nombre completo del mes.", ejemplo: "August", categoria: "derivada" },
    { campo: "Dia", tipo: "int64", descripcion: "Día del mes (1 a 31).", ejemplo: "5", categoria: "derivada" },
    { campo: "Hora", tipo: "int64", descripcion: "Hora del día en formato 24 hs (0 a 23).", ejemplo: "23", categoria: "derivada" },
    { campo: "Dia_Semana", tipo: "string", descripcion: "Nombre en español del día de la semana.", ejemplo: "Miércoles", categoria: "derivada" },
    { campo: "Es_FinDeSemana", tipo: "bool", descripcion: "Indica si el evento ocurrió durante el fin de semana.", ejemplo: "False", categoria: "derivada" },
    { campo: "Franja_Horaria", tipo: "string", descripcion: "Bloque horario del día para agrupamiento táctico.", ejemplo: "Noche (18-24)", categoria: "derivada" },
    { campo: "Patentes_Extraidas", tipo: "list", descripcion: "Lista de dominio/s vehiculares detectados en el relato.", ejemplo: "['A115NAU']", categoria: "derivada" },
    { campo: "Patente_Principal", tipo: "string", descripcion: "Dominio principal extraído del vehículo involucrado.", ejemplo: "A115NAU", categoria: "derivada" },
    { campo: "Marca_Detectada", tipo: "string", descripcion: "Marca comercial del vehículo identificada en el relato.", ejemplo: "ZANELLA, CHEVROLET", categoria: "derivada" },
    { campo: "Origen_Dataset", tipo: "string", descripcion: "Identificador del dataset fuente de procedencia.", ejemplo: "ROBO_AUTO_MOTO", categoria: "derivada" },
    
    { campo: "Fecha_Robo", tipo: "datetime64", descripcion: "Fecha y hora en que se registró el robo del vehículo.", ejemplo: "2026-01-01 01:54:00", categoria: "recuperacion" },
    { campo: "Fecha_Hallazgo", tipo: "datetime64", descripcion: "Fecha y hora en que se registró el hallazgo del vehículo.", ejemplo: "2026-01-01 07:18:00", categoria: "recuperacion" },
    { campo: "Horas_Hasta_Hallazgo", tipo: "float64", descripcion: "Horas transcurridas desde el robo hasta el hallazgo.", ejemplo: "5.4", categoria: "recuperacion" },
    { campo: "Dias_Hasta_Hallazgo", tipo: "float64", descripcion: "Días transcurridos desde el robo hasta el hallazgo.", ejemplo: "0.22", categoria: "recuperacion" },
  ];

  const filteredData = dictionaryData.filter((item) => {
    const matchesTab = activeTab === "todas" || item.categoria === activeTab;
    const matchesSearch =
      item.campo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">
          <span>📖 Diccionario de Datos del Proyecto</span>
        </div>
        <p className="card-subtitle">
          Especificación completa de variables originales del 911, atributos enriquecidos por el ETL y métricas vehiculares.
        </p>

        {/* Filters & Search */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button
              className={`btn-logout ${activeTab === "todas" ? "active" : ""}`}
              onClick={() => setActiveTab("todas")}
            >
              Todas (28)
            </button>
            <button
              className={`btn-logout ${activeTab === "original" ? "active" : ""}`}
              onClick={() => setActiveTab("original")}
            >
              Originales (10)
            </button>
            <button
              className={`btn-logout ${activeTab === "derivada" ? "active" : ""}`}
              onClick={() => setActiveTab("derivada")}
            >
              Derivadas ETL (14)
            </button>
            <button
              className={`btn-logout ${activeTab === "recuperacion" ? "active" : ""}`}
              onClick={() => setActiveTab("recuperacion")}
            >
              Recuperación (4)
            </button>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: "2.2rem" }}
              placeholder="Buscar variable..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Campo / Variable</th>
                <th>Tipo de Dato</th>
                <th>Descripción</th>
                <th>Ejemplo de Valor</th>
                <th>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.campo}>
                  <td><strong style={{ color: "var(--accent-indigo)" }}>{item.campo}</strong></td>
                  <td><code style={{ background: "var(--bg-base)", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>{item.tipo}</code></td>
                  <td>{item.descripcion}</td>
                  <td><span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{item.ejemplo}</span></td>
                  <td>
                    <span className="badge" style={{
                      color: item.categoria === "original" ? "#06b6d4" : item.categoria === "derivada" ? "#f59e0b" : "#10b981",
                      borderColor: "transparent"
                    }}>
                      {item.categoria.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
