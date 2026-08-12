"use client";

import React, { useState, useRef } from "react";
import { GitFork, Share2, Layers, Info, Filter, Shield, Download, FileText, Zap, Link as LinkIcon, ZoomIn, ZoomOut, RotateCcw, Move } from "lucide-react";
import { highlightRelato } from "@/lib/nlpExtractor";
import { exportToCSV } from "@/lib/excelExport";
import { generateExecutiveDossierPDF } from "@/lib/pdfReport";

interface Node {
  id: string;
  label: string;
  category: "brand" | "weapon" | "time" | "modus" | "nlp_cell";
  count: number;
  x: number;
  y: number;
  color: string;
  description?: string;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

const GRAPH_NODES: Node[] = [
  // Brands
  { id: "honda", label: "Honda (Wave/Tornado)", category: "brand", count: 400, x: 180, y: 140, color: "#6366f1", description: "Principal objetivo de sustracción motovehículos" },
  { id: "zanella", label: "Zanella (ZB 110)", category: "brand", count: 195, x: 150, y: 300, color: "#8b5cf6", description: "Alta tasa de desguace en < 12 horas" },
  { id: "fiat", label: "Fiat (Uno/Cronos)", category: "brand", count: 171, x: 340, y: 100, color: "#ec4899", description: "Frecuentemente utilizado como auto de apoyo" },
  { id: "peugeot", label: "Peugeot (208/206)", category: "brand", count: 145, x: 380, y: 240, color: "#f43f5e", description: "Sustracciones en vía pública mediante inhibidores" },

  // Weapons & Times
  { id: "arma_fuego", label: "Armas de Fuego", category: "weapon", count: 377, x: 540, y: 120, color: "#ef4444", description: "Uso de armas cortas en abordajes de robos" },
  { id: "calibre_9mm", label: "Pistolas 9mm / Calibres", category: "weapon", count: 67, x: 670, y: 190, color: "#dc2626", description: "Evidencia balística recuperada en 911" },
  { id: "noche", label: "Noche (18-24 hs) [Pico]", category: "time", count: 3397, x: 480, y: 460, color: "#eab308", description: "Franja horaria con mayor volumen de despachos" },

  // Modus Operandi & Multi-Vehicle NLP Cells
  { id: "desguace", label: "Desguace Inmediato (Motos)", category: "modus", count: 58, x: 110, y: 440, color: "#10b981", description: "Trazabilidad comprobada de recuperación" },
  { id: "vehiculo_apoyo", label: "Vehículo Apoyo / Abandono", category: "modus", count: 142, x: 520, y: 310, color: "#06b6d4", description: "Escape en convoy multi-vehículo" },
  
  // NEW NLP Multi-Vehicle & Pattern Coincidence Nodes
  { id: "moto_negra_dos", label: "⚡ Célula: Moto 110cc Negra (2 Sujetos)", category: "nlp_cell", count: 482, x: 270, y: 380, color: "#f97316", description: "Patrón NLP recurrente: 2 masculinos en moto 110cc sin patente" },
  { id: "gol_gris_apoyo", label: "⚡ Célula: VW Gol Gris (Auto Apoyo)", category: "nlp_cell", count: 138, x: 690, y: 340, color: "#a855f7", description: "Vehículo de apoyo detectado en fugas de cuadrante" },
  { id: "patente_clonada", label: "⚡ Patentes Clonadas / Dobladas", category: "nlp_cell", count: 58, x: 310, y: 220, color: "#14b8a6", description: "Coincidencia de patentes duplicadas o apócrifas" }
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
  const [selectedNode, setSelectedNode] = useState<Node | null>(GRAPH_NODES[0]);

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
    // Only pan if not clicking directly on a node element
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
                Grafo Complejo de Conexiones Multi-Vehículo & Redes NLP Coincidentes
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Vinculación de patentes, marcas, calibres y patrones de modus operandi de {incidents.length.toLocaleString()} despachos del 911.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={() => generateExecutiveDossierPDF({ incidents, recoveries, gangs })}
              style={{
                height: "38px",
                padding: "0 1.2rem",
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
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)"
              }}
            >
              <FileText size={16} /> 📄 Generar Dossier Institucional (PDF)
            </button>

            <button
              onClick={() => exportToCSV("grafo_conexiones_multi_vehiculo", filteredIncidents)}
              className="btn-logout"
              style={{ height: "38px", padding: "0 1rem", fontSize: "0.8rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Download size={15} /> Exportar Selección a Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Graph Canvas + Incident Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Interactive Network SVG Graph with Zoom & Pan */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Share2 size={16} color="var(--accent-purple)" /> Red de Coincidencias & Células Multi-Vehículo
            </h3>
            
            {/* Interactive Zoom Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <button
                onClick={handleZoomIn}
                style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                title="Acercar (Zoom In)"
              >
                <ZoomIn size={14} /> +
              </button>
              <button
                onClick={handleZoomOut}
                style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                title="Alejar (Zoom Out)"
              >
                <ZoomOut size={14} /> -
              </button>
              <button
                onClick={handleResetZoom}
                style={{ padding: "0.3rem 0.55rem", fontSize: "0.75rem", fontWeight: 700, borderRadius: "5px", border: "1px solid var(--border)", background: "var(--bg-base)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem" }}
                title="Restablecer Vista Ortogonal"
              >
                <RotateCcw size={12} /> Reset ({Math.round(zoomScale * 100)}%)
              </button>
            </div>
          </div>

          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <Move size={12} /> Podés arrastrar el canvas para desplazarte o usar la rueda del mouse para hacer Zoom.
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
              height: "520px",
              background: "var(--bg-base)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              position: "relative",
              overflow: "hidden",
              cursor: isDragging ? "grabbing" : "grab",
              userSelect: "none"
            }}
          >
            <svg
              style={{ width: "100%", height: "100%" }}
              viewBox="0 0 800 550"
            >
              {/* Transformed Group Container */}
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
                {/* Draw Edges */}
                {GRAPH_EDGES.map((edge, idx) => {
                  const sourceNode = GRAPH_NODES.find((n) => n.id === edge.source);
                  const targetNode = GRAPH_NODES.find((n) => n.id === edge.target);

                  if (!sourceNode || !targetNode) return null;

                  const isConnected =
                    selectedNode && (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);

                  return (
                    <g key={idx}>
                      <line
                        x1={sourceNode.x}
                        y1={sourceNode.y}
                        x2={targetNode.x}
                        y2={targetNode.y}
                        stroke={isConnected ? "var(--accent-indigo)" : "rgba(255,255,255,0.12)"}
                        strokeWidth={isConnected ? 3.5 : 1.5}
                        strokeDasharray={isConnected ? "none" : "4, 4"}
                      />
                      {isConnected && (
                        <text
                          x={(sourceNode.x + targetNode.x) / 2}
                          y={(sourceNode.y + targetNode.y) / 2 - 8}
                          fill="#a5b4fc"
                          fontSize="10"
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
                  const isConnected = activeEdges.some(
                    (e) => e.source === node.id || e.target === node.id
                  );

                  return (
                    <g
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={isSelected ? 26 : isConnected ? 22 : 18}
                        fill={node.color}
                        stroke={isSelected ? "#ffffff" : isConnected ? "var(--accent-indigo)" : "transparent"}
                        strokeWidth={isSelected ? 3.5 : 2}
                        style={{ transition: "all 0.2s ease" }}
                      />
                      <text
                        x={node.x}
                        y={node.y + (isSelected ? 42 : 36)}
                        fill={isSelected ? "#ffffff" : "var(--text-secondary)"}
                        fontSize={isSelected ? "11.5" : "10"}
                        fontWeight={isSelected ? "800" : "600"}
                        textAnchor="middle"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Right Column: Node Details & Incident Inspector */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {selectedNode ? (
            <>
              <div style={{ borderLeft: `4px solid ${selectedNode.color}`, paddingLeft: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)" }}>
                  Nodo Seleccionado
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: "0.2rem 0", color: "var(--text-primary)" }}>
                  {selectedNode.label}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                  {selectedNode.description || "Patrón serial detectado"} | <strong>{selectedNode.count} coincidencias en 911</strong>
                </p>
              </div>

              {/* Edge Connections List */}
              <div style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.4rem" }}>
                  <LinkIcon size={12} /> Conexiones Directas en la Red:
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {activeEdges.map((e, i) => (
                    <div key={i} style={{ fontSize: "0.775rem", color: "var(--text-primary)", display: "flex", justifyContent: "space-between" }}>
                      <span>🔗 {e.label}</span>
                      <span style={{ color: "var(--accent-indigo)", fontWeight: 700 }}>Peso: {e.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 911 Incidents matching selected Node */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Despachos Coincidentes ({filteredIncidents.length})
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Muestra 911</span>
                </div>

                <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {filteredIncidents.map((inc, idx) => (
                    <div key={inc.ID || idx} style={{ background: "var(--bg-base)", padding: "0.65rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.775rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "var(--accent-indigo)", marginBottom: "0.2rem" }}>
                        <span>ID: {inc.ID} - {inc.Origen_Dataset}</span>
                        <span>{inc.Fecha} ({inc.Hora}:00 hs)</span>
                      </div>
                      <div style={{ color: "var(--text-primary)", margin: "0.2rem 0" }}>
                        <b>Dirección:</b> {inc.Dirección || inc.direccion}
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontStyle: "italic", background: "rgba(255,255,255,0.03)", padding: "0.4rem", borderRadius: "4px" }}>
                        {highlightRelato(inc.Relato || inc.relato || "")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem 1rem" }}>
              Seleccioná un nodo en el mapa para examinar sus conexiones y despachos 911 asociados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
