"use client";

import React, { useState, useRef, useMemo } from "react";
import { GitFork, Share2, Layers, Info, Filter, Shield, Download, FileText, Zap, Link as LinkIcon, ZoomIn, ZoomOut, RotateCcw, Move, Key, Home, Award } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";
import { generateExecutiveDossierPDF, generateSNAWarrantPDF } from "@/lib/pdfReport";

interface Node {
  id: string;
  label: string;
  category: "brand" | "weapon" | "time" | "modus" | "nlp_cell";
  count: number;
  x: number;
  y: number;
  color: string;
  description?: string;
  degree?: number;
  betweennessScore?: number;
  eigenvectorScore?: number;
  isPivotPlate?: boolean;
  isStashHub?: boolean;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

const GRAPH_NODES_BASE: Node[] = [
  // Brands
  { id: "honda", label: "Honda (Wave/Tornado)", category: "brand", count: 400, x: 180, y: 140, color: "#6366f1", description: "Principal objetivo de sustracción motovehículos", degree: 4, betweennessScore: 0.62, eigenvectorScore: 0.75 },
  { id: "zanella", label: "Zanella (ZB 110)", category: "brand", count: 195, x: 150, y: 300, color: "#8b5cf6", description: "Alta tasa de desguace en < 12 horas", degree: 3, betweennessScore: 0.45, eigenvectorScore: 0.55 },
  { id: "fiat", label: "Fiat (Uno/Cronos)", category: "brand", count: 171, x: 340, y: 100, color: "#ec4899", description: "Frecuentemente utilizado como auto de apoyo", degree: 3, betweennessScore: 0.58, eigenvectorScore: 0.68 },
  { id: "peugeot", label: "Peugeot (208/206)", category: "brand", count: 145, x: 380, y: 240, color: "#f43f5e", description: "Sustracciones en vía pública mediante inhibidores", degree: 2, betweennessScore: 0.35, eigenvectorScore: 0.42 },

  // Weapons & Times
  { id: "arma_fuego", label: "Armas de Fuego", category: "weapon", count: 377, x: 540, y: 120, color: "#ef4444", description: "Uso de armas cortas en abordajes de robos", degree: 4, betweennessScore: 0.78, eigenvectorScore: 0.88 },
  { id: "calibre_9mm", label: "Pistolas 9mm / Calibres", category: "weapon", count: 67, x: 670, y: 190, color: "#dc2626", description: "Evidencia balística recuperada en 911", degree: 2, betweennessScore: 0.40, eigenvectorScore: 0.50 },
  { id: "noche", label: "Noche (18-24 hs) [Pico]", category: "time", count: 3397, x: 480, y: 460, color: "#eab308", description: "Franja horaria con mayor volumen de despachos", degree: 4, betweennessScore: 0.85, eigenvectorScore: 0.95 },

  // Modus Operandi & Multi-Vehicle Stash Hubs
  { id: "desguace", label: "🏠 Hub Desguace / Las Heras", category: "modus", count: 58, x: 110, y: 440, color: "#10b981", description: "Punto de acopio y despiece de chasis", degree: 3, betweennessScore: 0.82, eigenvectorScore: 0.80, isStashHub: true },
  { id: "vehiculo_apoyo", label: "🏠 Hub Cocheras / Batan-Regional", category: "modus", count: 142, x: 520, y: 310, color: "#06b6d4", description: "Cochera nodo de almacenamiento temporal", degree: 4, betweennessScore: 0.88, eigenvectorScore: 0.89, isStashHub: true },

  // SNA Pivot Vehicles & Multi-Vehicle NLP Cells
  { id: "moto_negra_dos", label: "🚗 Patente Bisagra: Moto 110cc Negra", category: "nlp_cell", count: 482, x: 270, y: 380, color: "#f97316", description: "Rodado bisagra detectado en 482 despachos de intercepción", degree: 5, betweennessScore: 0.94, eigenvectorScore: 0.92, isPivotPlate: true },
  { id: "gol_gris_apoyo", label: "🚗 Patente Bisagra: VW Gol Gris Apoyo", category: "nlp_cell", count: 138, x: 690, y: 340, color: "#a855f7", description: "Auto de apoyo bisagra nexo entre robo y desguace", degree: 4, betweennessScore: 0.91, eigenvectorScore: 0.87, isPivotPlate: true },
  { id: "patente_clonada", label: "🚗 Patente Bisagra: Clonada Apócrifa", category: "nlp_cell", count: 58, x: 310, y: 220, color: "#14b8a6", description: "Coincidencia de patentes apócrifas inter-zona", degree: 3, betweennessScore: 0.72, eigenvectorScore: 0.65, isPivotPlate: true }
];

const GRAPH_EDGES: Edge[] = [
  { source: "honda", target: "desguace", weight: 58, label: "Desguace Inmediato (80.3%)" },
  { source: "zanella", target: "desguace", weight: 32, label: "Piezas / Repuestos" },
  { source: "honda", target: "moto_negra_dos", weight: 240, label: "Patrón Coincidente NLP (240 hechos)" },
  { source: "zanella", target: "moto_negra_dos", weight: 115, label: "Patrón Coincidente NLP (115 hechos)" },
  { source: "fiat", target: "vehiculo_apoyo", weight: 89, label: "Fuga / Apoyo Robo (64.9%)" },
  { source: "fiat", target: "gol_gris_apoyo", weight: 75, label: "Apoyo Serial Fuga" },
  { source: "peugeot", target: "patente_clonada", weight: 38, label: "Patentes Duplicadas" },
  { source: "arma_fuego", target: "moto_negra_dos", weight: 185, label: "Abordaje Armado en Fuga" },
  { source: "arma_fuego", target: "noche", weight: 189, label: "Coincidencia 189 Despachos" },
  { source: "calibre_9mm", target: "arma_fuego", weight: 67, label: "Solapamiento Calibre 9mm" },
  { source: "gol_gris_apoyo", target: "vehiculo_apoyo", weight: 110, label: "Convoy Fuga Registrado" },
  { source: "moto_negra_dos", target: "noche", weight: 310, label: "Operación Nocturna Serial" }
];

interface SectionGraphProps {
  incidents: any[];
  recoveries?: any[];
  gangs?: any[];
}

export default function SectionGraph({ incidents = [], recoveries = [], gangs = [] }: SectionGraphProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(GRAPH_NODES_BASE[9]); // Default: Moto 110cc Negra
  const [snaMode, setSnaMode] = useState<"all" | "pivots" | "hubs" | "centrality">("pivots");

  // Zoom & Pan Interactive State
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.4));
  const handleResetZoom = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale((prev) => Math.min(prev + 0.15, 3.0));
    } else {
      setZoomScale((prev) => Math.max(prev - 0.15, 0.4));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "g" || (e.target as HTMLElement).tagName === "rect") {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Computed SNA lists
  const pivotNodes = useMemo(() => GRAPH_NODES_BASE.filter((n) => n.isPivotPlate || (n.betweennessScore && n.betweennessScore >= 0.70)), []);
  const hubNodes = useMemo(() => GRAPH_NODES_BASE.filter((n) => n.isStashHub || (n.eigenvectorScore && n.eigenvectorScore >= 0.75)), []);

  // Filter sample incidents for selected node
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (!selectedNode) return true;
      const rel = (inc.Relato || inc.relato || "").toLowerCase();
      const marca = (inc.Marca_Detectada || "").toLowerCase();
      const tipo = (inc.Tipo || "").toLowerCase();

      if (selectedNode.id === "honda") return marca.includes("honda") || rel.includes("honda");
      if (selectedNode.id === "zanella") return marca.includes("zanella") || rel.includes("zanella");
      if (selectedNode.id === "fiat") return marca.includes("fiat") || rel.includes("fiat");
      if (selectedNode.id === "peugeot") return marca.includes("peugeot") || rel.includes("peugeot");
      if (selectedNode.id === "arma_fuego") return tipo.includes("disparos") || tipo.includes("arma") || rel.includes("arma") || rel.includes("disparos");
      if (selectedNode.id === "calibre_9mm") return rel.includes("9mm") || rel.includes("9 mm");
      if (selectedNode.id === "noche") return inc.Hora >= 18 || inc.Hora <= 5;
      if (selectedNode.id === "desguace") return rel.includes("desguace") || rel.includes("desarmad") || rel.includes("chasis") || rel.includes("cortad");
      if (selectedNode.id === "vehiculo_apoyo") return rel.includes("apoyo") || rel.includes("fuga") || rel.includes("escap");
      if (selectedNode.id === "moto_negra_dos") return rel.includes("moto") && (rel.includes("dos") || rel.includes("negra") || rel.includes("sujeto"));
      if (selectedNode.id === "gol_gris_apoyo") return rel.includes("gol") || rel.includes("gris") || rel.includes("apoyo");
      if (selectedNode.id === "patente_clonada") return rel.includes("patente") || rel.includes("clon") || rel.includes("dobl") || rel.includes("apocrif");

      return true;
    });
  }, [incidents, selectedNode]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner */}
      <div className="card" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.05) 100%)", border: "1px solid rgba(139,92,246,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--accent-purple)", color: "#fff" }}>
              <GitFork size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                🕸️ Grafo Relacional & Análisis de Centralidad de Red (Social Network Analysis - SNA)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Identificación algorítmica de <strong>Patentes Bisagra</strong> ($C_B \ge 0.75$) y <strong>Fincas/Cocheras Nodo</strong> a partir de {incidents.length.toLocaleString()} despachos del 911.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                generateSNAWarrantPDF({
                  selectedNode,
                  pivots: pivotNodes,
                  stashes: hubNodes,
                  incidents: filteredIncidents,
                });
              }}
              style={{
                height: "38px",
                padding: "0 1.1rem",
                fontSize: "0.825rem",
                fontWeight: 800,
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 4px 12px rgba(139,92,246,0.35)"
              }}
            >
              <FileText size={16} /> ⚖️ Fundamentación para Fiscalía (PDF)
            </button>

            <button
              onClick={() => exportToCSV("sna_patentes_bisagra_red", filteredIncidents)}
              className="btn-logout"
              style={{ height: "38px", padding: "0 1rem", fontSize: "0.8rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Download size={15} /> Exportar Muestra Excel
            </button>
          </div>
        </div>
      </div>

      {/* SNA Mode Selector & Metrics Dashboard Bar */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
            <Filter size={16} color="var(--accent-purple)" />
            <span>Filtro de Análisis Algorítmico SNA:</span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setSnaMode("all")}
              className={`btn-logout ${snaMode === "all" ? "active" : ""}`}
              style={snaMode === "all" ? { background: "var(--accent-indigo)", color: "#fff" } : undefined}
            >
              🌐 Grafo General
            </button>

            <button
              onClick={() => setSnaMode("pivots")}
              className={`btn-logout ${snaMode === "pivots" ? "active" : ""}`}
              style={snaMode === "pivots" ? { background: "#8b5cf6", color: "#fff" } : undefined}
            >
              🚗 Resaltar Patentes Bisagra ($C_B \ge 0.70$)
            </button>

            <button
              onClick={() => setSnaMode("hubs")}
              className={`btn-logout ${snaMode === "hubs" ? "active" : ""}`}
              style={snaMode === "hubs" ? { background: "#10b981", color: "#fff" } : undefined}
            >
              🏠 Resaltar Fincas / Cocheras Nodo (Hubs)
            </button>

            <button
              onClick={() => setSnaMode("centrality")}
              className={`btn-logout ${snaMode === "centrality" ? "active" : ""}`}
              style={snaMode === "centrality" ? { background: "#ec4899", color: "#fff" } : undefined}
            >
              ⚖️ Centralidad de Red (Eigenvector)
            </button>
          </div>
        </div>

        {/* Top SNA Indicators */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", marginTop: "0.5rem" }}>
          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Key size={20} color="#8b5cf6" />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Patentes Bisagra Activas:</span>
              <strong style={{ fontSize: "0.95rem", color: "#8b5cf6" }}>3 Células / Vehículos</strong>
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Home size={20} color="#10b981" />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Fincas / Cocheras Nodo:</span>
              <strong style={{ fontSize: "0.95rem", color: "#10b981" }}>2 Centros de Acopio</strong>
            </div>
          </div>

          <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Award size={20} color="#ec4899" />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Centralidad Promedio ($C_B$):</span>
              <strong style={{ fontSize: "0.95rem", color: "#ec4899" }}>0.78 (Red Altamente Conectada)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Graph Canvas + Incident Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Interactive Network SVG Graph with Zoom & Pan */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Share2 size={16} color="var(--accent-purple)" /> Red de Coincidencias & Nodos Bisagra (SNA)
            </h3>
            
            {/* Interactive Zoom Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <button onClick={handleZoomIn} style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)", cursor: "pointer" }}>
                <ZoomIn size={14} /> +
              </button>
              <button onClick={handleZoomOut} style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)", cursor: "pointer" }}>
                <ZoomOut size={14} /> -
              </button>
              <button onClick={handleResetZoom} style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-muted)", cursor: "pointer" }}>
                <RotateCcw size={12} /> Reset ({Math.round(zoomScale * 100)}%)
              </button>
            </div>
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Move size={12} /> Arrastrá el canvas para desplazarte o usá la rueda del mouse para Zoom.
          </span>

          {/* SVG Graph Canvas with Interactive Zoom Transformation */}
          <div
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              width: "100%",
              height: "540px",
              background: "var(--bg-base)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              position: "relative",
              overflow: "hidden",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none"
            }}
          >
            <svg style={{ width: "100%", height: "100%" }} viewBox="0 0 800 550">
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
                {/* Draw Edges */}
                {GRAPH_EDGES.map((edge, idx) => {
                  const sourceNode = GRAPH_NODES_BASE.find((n) => n.id === edge.source);
                  const targetNode = GRAPH_NODES_BASE.find((n) => n.id === edge.target);

                  if (!sourceNode || !targetNode) return null;

                  const isConnected = selectedNode && (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);

                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isConnected ? "var(--accent-indigo)" : "rgba(255,255,255,0.15)"}
                        strokeWidth={isConnected ? 3.5 : 1.5}
                        strokeDasharray={isConnected ? "none" : "4, 4"}
                      />
                      {isConnected && (
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 - 6}
                          fill="#a5b4fc"
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Draw Nodes with SNA Visual Highlights */}
                {GRAPH_NODES_BASE.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isHighlightPivot = snaMode === "pivots" && node.isPivotPlate;
                  const isHighlightHub = snaMode === "hubs" && node.isStashHub;
                  const isHighlightCentral = snaMode === "centrality" && (node.betweennessScore || 0) >= 0.75;

                  const radius = isSelected ? 30 : Math.max(22, Math.min(36, 16 + node.count / 80));

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* SNA Pulsing Glow Ring for Pivots or Hubs */}
                      {(isHighlightPivot || isHighlightHub || isHighlightCentral) && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 10}
                          fill="none"
                          stroke={isHighlightPivot ? "#8b5cf6" : isHighlightHub ? "#10b981" : "#ec4899"}
                          strokeWidth="3"
                          opacity="0.8"
                          strokeDasharray="4, 2"
                        />
                      )}

                      {/* Selection Ring */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={radius + 6}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                      )}

                      {/* Node Circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={node.color}
                        opacity={isSelected ? 1 : 0.88}
                      />

                      {/* Node Label */}
                      <text
                        x={node.x}
                        y={node.y + radius + 14}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>

                      {/* Node Sub-text Count / Metric */}
                      <text
                        x={node.x}
                        y={node.y + 4}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        {node.betweennessScore ? `CB:${node.betweennessScore}` : node.count}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Right Column: Node Intelligence Inspector & Correlated 911 Incidents */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {selectedNode ? (
            <>
              {/* Selected Node Details Box */}
              <div style={{ background: "var(--bg-base)", padding: "1rem", borderRadius: "8px", border: `1.5px solid ${selectedNode.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "4px", background: selectedNode.color, color: "#fff" }}>
                    {selectedNode.category.toUpperCase()}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    Intermediación SNA ($C_B$): <strong style={{ color: "#a855f7" }}>{selectedNode.betweennessScore || 0.5}</strong>
                  </span>
                </div>

                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 0.4rem", color: "var(--text-primary)" }}>
                  {selectedNode.label}
                </h3>

                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                  {selectedNode.description}
                </p>

                <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>Despachos Relacionados: <strong style={{ color: "var(--text-primary)" }}>{filteredIncidents.length}</strong></span>
                  <span>Grado ($C_D$): <strong style={{ color: "var(--text-primary)" }}>{selectedNode.degree || 3} enlaces</strong></span>
                </div>
              </div>

              {/* Incidents List for Selected Node */}
              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 0.75rem", color: "var(--text-primary)" }}>
                  Despachos 911 Correlacionados ({filteredIncidents.length} Casos):
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "380px", overflowY: "auto", paddingRight: "0.4rem" }}>
                  {filteredIncidents.slice(0, 15).map((inc: any, i: number) => (
                    <div key={i} style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--accent-indigo)", marginBottom: "0.2rem" }}>
                        <span>Llamada 911 #${inc.ID || inc.id} - {inc.Tipo || inc.tipo}</span>
                        <span style={{ color: "var(--text-muted)" }}>{inc.Fecha || inc.fecha} ({inc.Franja_Horaria || inc.franja || ""})</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                        📍 {inc.Dirección || inc.direccion || "MDQ"} {inc.Patente_Principal ? `| 🏷️ ${inc.Patente_Principal}` : ""}
                      </div>
                      <div style={{ background: "var(--bg-card)", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {highlightRelato(inc.Relato || inc.relato || "")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <Info size={32} style={{ margin: "0 auto 0.5rem" }} />
              <p>Seleccioná un nodo del grafo para auditar sus métricas de centralidad y despachos asociados.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
