"use client";

import React, { useState } from "react";
import { GitFork, Share2, Layers, Info, Filter, Shield, Download } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";

interface Node {
  id: string;
  label: string;
  category: "brand" | "weapon" | "time" | "modus";
  count: number;
  x: number;
  y: number;
  color: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

const GRAPH_NODES: Node[] = [
  // Brands
  { id: "honda", label: "Honda (Wave/Tornado)", category: "brand", count: 400, x: 220, y: 160, color: "#6366f1" },
  { id: "zanella", label: "Zanella (ZB 110)", category: "brand", count: 195, x: 180, y: 320, color: "#8b5cf6" },
  { id: "fiat", label: "Fiat (Uno/Cronos)", category: "brand", count: 171, x: 380, y: 120, color: "#ec4899" },
  { id: "peugeot", label: "Peugeot (208/206)", category: "brand", count: 145, x: 420, y: 280, color: "#f43f5e" },

  // Weapons
  { id: "arma_fuego", label: "Armas de Fuego", category: "weapon", count: 377, x: 580, y: 160, color: "#ef4444" },
  { id: "calibre_9mm", label: "Pistolas 9mm", category: "weapon", count: 67, x: 680, y: 260, color: "#dc2626" },

  // Modus Operandi & Times
  { id: "madrugada", label: "Madrugada (00-06 hs)", category: "time", count: 1240, x: 320, y: 440, color: "#f59e0b" },
  { id: "noche", label: "Noche (18-24 hs) [Pico]", category: "time", count: 3397, x: 500, y: 420, color: "#eab308" },
  { id: "desguace", label: "Desguace Inmediato (Motos)", category: "modus", count: 58, x: 140, y: 480, color: "#10b981" },
  { id: "vehiculo_apoyo", label: "Vehículo Apoyo / Abandono", category: "modus", count: 142, x: 560, y: 300, color: "#06b6d4" },
];

const GRAPH_EDGES: Edge[] = [
  { source: "honda", target: "desguace", weight: 58, label: "Desguace Inmediato (80.3%)" },
  { source: "zanella", target: "desguace", weight: 32, label: "Piezas / Repuestos" },
  { source: "fiat", target: "vehiculo_apoyo", weight: 89, label: "Fuga / Apoyo Robo (64.9%)" },
  { source: "peugeot", target: "vehiculo_apoyo", weight: 62, label: "Abandono en Vía Pública" },
  { source: "arma_fuego", target: "madrugada", weight: 145, label: "Coincidencia 145 Despachos" },
  { source: "arma_fuego", target: "noche", weight: 189, label: "Coincidencia 189 Despachos" },
  { source: "calibre_9mm", target: "arma_fuego", weight: 67, label: "Solapamiento Calibre 9mm" },
  { source: "honda", target: "noche", weight: 210, label: "Pico Horario Nocturno" },
  { source: "fiat", target: "madrugada", weight: 95, label: "Robo en Garages Nocturnos" },
];

interface SectionGraphProps {
  incidents: any[];
}

export default function SectionGraph({ incidents = [] }: SectionGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(GRAPH_NODES[0]);

  // Find edges connected to selected node
  const activeEdges = GRAPH_EDGES.filter(
    (e) => selectedNode && (e.source === selectedNode.id || e.target === selectedNode.id)
  );

  // Filter sample incidents for selected node
  const filteredIncidents = incidents.filter((inc) => {
    if (!selectedNode) return true;
    const rel = (inc.Relato || inc.relato || "").toLowerCase();
    const marca = (inc.Marca_Detectada || "").toLowerCase();
    const tipo = (inc.Tipo || "").toLowerCase();
    const subtipo = (inc.SubTipo || "").toLowerCase();

    if (selectedNode.id === "honda") return marca.includes("honda") || rel.includes("honda");
    if (selectedNode.id === "zanella") return marca.includes("zanella") || rel.includes("zanella");
    if (selectedNode.id === "fiat") return marca.includes("fiat") || rel.includes("fiat");
    if (selectedNode.id === "peugeot") return marca.includes("peugeot") || rel.includes("peugeot");
    if (selectedNode.id === "arma_fuego") return tipo.includes("disparos") || tipo.includes("arma") || rel.includes("arma") || rel.includes("disparos");
    if (selectedNode.id === "calibre_9mm") return rel.includes("9mm") || rel.includes("9 mm");
    if (selectedNode.id === "madrugada") return inc.Franja_Horaria?.includes("Madrugada");
    if (selectedNode.id === "noche") return inc.Franja_Horaria?.includes("Noche");
    if (selectedNode.id === "desguace") return subtipo.includes("motos") && (inc.Origen_Dataset === "HALLAZGO_AUTOMOTOR" || rel.includes("desguace"));
    if (selectedNode.id === "vehiculo_apoyo") return subtipo.includes("vehículos") && inc.Origen_Dataset === "HALLAZGO_AUTOMOTOR";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.05) 100%)", border: "1px solid rgba(99,102,241,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-indigo)", color: "#fff" }}>
            <GitFork size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Grafo Relacional & Redes de Co-ocurrencia
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
              Visualización de nodos de correlación entre Marcas Preferidas, Armamento, Modus Operandi y Zonas de Abandono.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Graph & Narrative Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Graph Canvas Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Share2 size={18} style={{ color: "var(--accent-indigo)" }} /> Red de Entidades Investigativas
            </h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Haz clic en un nodo para aislar enlaces</span>
          </div>

          {/* SVG Network Graph */}
          <div style={{ background: "var(--bg-base)", borderRadius: "8px", border: "1px solid var(--border)", padding: "1rem", display: "flex", justifyContent: "center" }}>
            <svg width="100%" height="450" viewBox="0 0 800 550" style={{ maxWidth: "800px" }}>
              {/* Draw Edges */}
              {GRAPH_EDGES.map((edge, idx) => {
                const sourceNode = GRAPH_NODES.find((n) => n.id === edge.source);
                const targetNode = GRAPH_NODES.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isConnected = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
                const strokeColor = isConnected ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.12)";
                const strokeWidth = isConnected ? 3 : 1.5;

                return (
                  <g key={idx}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={isConnected ? "6,3" : "none"}
                    />
                    {isConnected && (
                      <text
                        x={(sourceNode.x + targetNode.x) / 2}
                        y={(sourceNode.y + targetNode.y) / 2 - 8}
                        fill="#fde047"
                        fontSize="11"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Draw Nodes */}
              {GRAPH_NODES.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const radius = Math.min(38, Math.max(22, Math.sqrt(node.count) * 0.9));

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Glowing outer ring if selected */}
                    {isSelected && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke={node.color}
                        strokeWidth="2.5"
                        opacity="0.8"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      r={radius}
                      fill={node.color}
                      stroke="#1e293b"
                      strokeWidth="2"
                      opacity={selectedNode && !isSelected && !activeEdges.some((e) => e.source === node.id || e.target === node.id) ? 0.35 : 0.9}
                    />
                    <text
                      y={radius + 16}
                      fill="#f8fafc"
                      fontSize="12"
                      fontWeight={isSelected ? "700" : "500"}
                      textAnchor="middle"
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Node Category Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.75rem", color: "var(--text-muted)", paddingTop: "0.5rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#6366f1" }}></span> Marcas Automotores/Motos
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }}></span> Armamento & Calibres
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b" }}></span> Franjas Horarias Críticas
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }}></span> Modus Operandi & Destino
            </span>
          </div>
        </div>

        {/* Selected Node Details & Incident Audit Panel */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {selectedNode ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: selectedNode.color }}>
                    Nodo Seleccionado
                  </span>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0.2rem 0 0", color: "var(--text-primary)" }}>
                    {selectedNode.label}
                  </h3>
                </div>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, padding: "0.3rem 0.75rem", borderRadius: "6px", background: "var(--bg-base)", color: selectedNode.color, border: `1px solid ${selectedNode.color}40` }}>
                  {selectedNode.count} Casos
                </span>
              </div>

              {/* Connected Enlaces */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                  Relaciones & Enlaces de Co-ocurrencia:
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {activeEdges.length > 0 ? (
                    activeEdges.map((e, idx) => (
                      <div key={idx} style={{ fontSize: "0.8rem", padding: "0.5rem 0.75rem", borderRadius: "6px", background: "var(--bg-base)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{e.label}</span>
                        <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>{e.weight} coincidencias</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Sin enlaces directos destacados</span>
                  )}
                </div>
              </div>

              {/* Sample Incidents Matching Node */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>
                    Incidentes Vinculados ({filteredIncidents.length} Coincidencias):
                  </h4>

                  {filteredIncidents.length > 0 && (
                    <button
                      onClick={() => {
                        const exportData = filteredIncidents.map((inc) => ({
                          Nodo_Grafo: selectedNode.label,
                          ID_911: inc.ID,
                          Tipo: inc.Tipo,
                          SubTipo: inc.SubTipo,
                          Fecha: inc.Fecha,
                          Franja_Horaria: inc.Franja_Horaria,
                          Direccion: inc.Dirección || "",
                          Patente: inc.Patente_Principal || "",
                          Marca: inc.Marca_Detectada || "",
                          Relato_911: inc.Relato || inc.relato || "",
                        }));
                        exportToCSV(`grafo_relaciones_${selectedNode.id}`, exportData);
                      }}
                      className="btn-logout"
                      style={{ height: "28px", padding: "0 0.6rem", fontSize: "0.725rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      <Download size={12} /> Excel
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.3rem" }}>
                  {filteredIncidents.map((inc, i) => (
                    <div key={`${inc.ID}_${i}`} style={{ fontSize: "0.775rem", padding: "0.6rem", borderRadius: "6px", background: "var(--bg-base)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", fontWeight: 700, color: "var(--accent-indigo)" }}>
                        <span>ID #{inc.ID} - {inc.Tipo} ({inc.SubTipo})</span>
                        <span>{inc.Fecha}</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", lineHeight: 1.4 }}>
                        {highlightRelato(inc.Relato || inc.relato || "")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <Info size={32} style={{ color: "var(--accent-indigo)", margin: "0 auto 0.5rem" }} />
              <p>Selecciona un nodo en el gráfico para inspeccionar sus relaciones y relatos asociados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
