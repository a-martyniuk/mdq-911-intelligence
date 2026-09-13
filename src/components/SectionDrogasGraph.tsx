"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  Share2,
  Users,
  Home,
  Crosshair,
  ShieldAlert,
  Sparkles,
  Filter,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Move,
  Activity,
  ArrowRight,
  X,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Pill,
  Info,
  AlertTriangle,
  Layers,
  Building,
  Target
} from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateDrogasGraphPDF } from "@/lib/pdfReport";

export interface GraphNode {
  id: string;
  label: string;
  category: "suspect" | "bunker" | "substance" | "weapon";
  count: number;
  x: number;
  y: number;
  color: string;
  description: string;
  degree: number;
  betweennessScore?: number;
  isHub?: boolean;
  isArmed?: boolean;
  dominantSubstance?: string;
  cliqueId?: string;
  address?: string;
  barrio?: string;
  coords?: [number, number];
  incidents: any[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label: string;
  type: "suspect-bunker" | "suspect-suspect" | "suspect-substance" | "suspect-weapon" | "bunker-substance" | "bunker-weapon";
}

interface SectionDrogasGraphProps {
  incidents: any[];
}

const CLIQUE_PRESETS = [
  { id: "all", label: "Red General Completa JCP", color: "#6366f1", icon: "🌐" },
  { id: "sol-y-verde", label: "Foco Sol y Verde (Ojeda / Bravo / Corbata)", color: "#ef4444", icon: "🔥" },
  { id: "porta-berni", label: "Clan Boyacá (Porta / Lucho Berni)", color: "#f59e0b", icon: "🚗" },
  { id: "palomero", label: "Red San Lorenzo (Palomero / Banfi)", color: "#8b5cf6", icon: "📍" },
  { id: "coliqueo", label: "Célula Coliqueo & Junín (Hernán / Lili)", color: "#06b6d4", icon: "⚡" },
  { id: "fournier", label: "Clan Fournier (Poroto / Ariel / Pajone)", color: "#10b981", icon: "🏢" },
  { id: "lamas", label: "Célula Barrio Lamas & Casitas (Godoy / Angie)", color: "#ec4899", icon: "🏚️" }
];

export default function SectionDrogasGraph({ incidents = [] }: SectionDrogasGraphProps) {
  // Navigation & Filter States
  const [selectedClique, setSelectedClique] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minConnections, setMinConnections] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("polonia-pinero");
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Zoom & Pan Viewport States
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodeDragStartRef = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: 0,
    nodeY: 0
  });

  // Custom node positions from user dragging
  const [customPositions, setCustomPositions] = useState<Record<string, { x: number; y: number }>>({});

  // -------------------------------------------------------------
  // 1. DYNAMIC GRAPH CONSTRUCTION FROM 1,770 INCIDENTS
  // -------------------------------------------------------------
  const { allNodes, allEdges } = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return { allNodes: [], allEdges: [] };
    }

    // A. Extract Suspects (Alias) with >= 2 calls or core actors
    const suspectMap: Record<string, { count: number; calls: any[]; armed: number; substances: Record<string, number>; clique?: string }> = {};
    // B. Extract Bunkers / Critical Corners with >= 3 calls or linked to suspects
    const bunkerMap: Record<string, { count: number; calls: any[]; armed: number; substances: Record<string, number>; suspects: Set<string>; clique?: string; coords?: [number, number]; barrio?: string }> = {};

    // Helper to detect clique
    const detectClique = (text: string, address: string) => {
      const t = (text + " " + address).toLowerCase();
      if (t.includes("polonia") || t.includes("piñero") || t.includes("pinero") || t.includes("sol y verde") || t.includes("ojeda") || t.includes("bravo") || t.includes("corbata") || t.includes("tore")) return "sol-y-verde";
      if (t.includes("boyaca") || t.includes("pinazo") || t.includes("berni") || t.includes("porta") || t.includes("lucho")) return "porta-berni";
      if (t.includes("san lorenzo") || t.includes("pedro de mendoza") || t.includes("tres sargentos") || t.includes("palomero") || t.includes("banfi") || t.includes("cachi")) return "palomero";
      if (t.includes("cacique coliqueo") || t.includes("coliqueo") || t.includes("junin") || t.includes("hernan") || t.includes("lili")) return "coliqueo";
      if (t.includes("fournier") || t.includes("lasalle") || t.includes("poroto") || t.includes("pajone")) return "fournier";
      if (t.includes("barrio lamas") || t.includes("saavedra lamas") || t.includes("nestor kirchner") || t.includes("kirchner") || t.includes("godoy") || t.includes("angie")) return "lamas";
      return "general";
    };

    incidents.forEach((inc) => {
      const p = (inc.partido || "").toUpperCase();
      if (p.includes("MALVINAS") || p.includes("GENERAL PUEYRREDON") || p.includes("MDP")) return;

      const rel = inc.relato || inc.Relato || "";
      const addr = inc.direccion || inc.Dirección || inc.calle || "";
      const addrClean = addr.trim();
      const isArmed = Boolean(inc.tieneArmas || inc.Tiene_Armas);
      const sust = inc.sustancia || inc.SubTipo || "Estupefacientes";
      const clique = detectClique(rel, addrClean);

      // Process suspects
      const aliases = inc.alias || inc.Alias_Identificados || [];
      aliases.forEach((rawAlias: string) => {
        const a = rawAlias.trim().replace(/^El\s+/i, "El ").replace(/^La\s+/i, "La ");
        if (a.length >= 3 && !["Desconoce", "No Sabe", "Sin Datos", "Venta", "Drogas", "Bunker", "Transa"].includes(a)) {
          if (!suspectMap[a]) {
            suspectMap[a] = { count: 0, calls: [], armed: 0, substances: {}, clique };
          }
          suspectMap[a].count += 1;
          suspectMap[a].calls.push(inc);
          if (isArmed) suspectMap[a].armed += 1;
          suspectMap[a].substances[sust] = (suspectMap[a].substances[sust] || 0) + 1;
        }
      });

      // Process bunkers / addresses
      if (addrClean && !["José C. Paz", "OTRA", ".", "OTRO", ":", "....", "NAN"].includes(addrClean.toUpperCase())) {
        if (!bunkerMap[addrClean]) {
          bunkerMap[addrClean] = {
            count: 0,
            calls: [],
            armed: 0,
            substances: {},
            suspects: new Set(),
            clique,
            coords: inc.lat && inc.lng ? [Number(inc.lat), Number(inc.lng)] : undefined,
            barrio: inc.barrio || inc.Barrio_Detectado
          };
        }
        bunkerMap[addrClean].count += 1;
        bunkerMap[addrClean].calls.push(inc);
        if (isArmed) bunkerMap[addrClean].armed += 1;
        bunkerMap[addrClean].substances[sust] = (bunkerMap[addrClean].substances[sust] || 0) + 1;
        aliases.forEach((a: string) => bunkerMap[addrClean].suspects.add(a));
      }
    });

    // Curate top Suspect nodes (>= 2 calls or specific relevant actor)
    const suspectNodes: GraphNode[] = [];
    Object.entries(suspectMap)
      .filter(([name, data]) => data.count >= 2 || ["Eduardo Bravo", "Agustin", "Corbata", "Sosa", "Tore", "Gonzalo Martin Godoy", "Banfi", "Lucho"].includes(name))
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 35)
      .forEach(([name, data]) => {
        const topSust = Object.entries(data.substances).sort((x, y) => y[1] - x[1])[0]?.[0] || "Cocaína / Paco";
        suspectNodes.push({
          id: `suspect-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          label: name,
          category: "suspect",
          count: data.count,
          x: 0,
          y: 0,
          color: "#8b5cf6",
          description: `Sospechoso identificado en ${data.count} denuncias 911. ${data.armed > 0 ? `Involucrado en ${data.armed} hechos con armas.` : "Sin armas registradas."}`,
          degree: 0,
          isArmed: data.armed > 0,
          dominantSubstance: topSust,
          cliqueId: data.clique || "general",
          incidents: data.calls
        });
      });

    // Curate top Bunker nodes (>= 4 calls or linked to known suspects)
    const bunkerNodes: GraphNode[] = [];
    Object.entries(bunkerMap)
      .filter(([addr, data]) => data.count >= 4 || data.suspects.size >= 2 || addr.toLowerCase().includes("polonia") || addr.toLowerCase().includes("castelli"))
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30)
      .forEach(([addr, data]) => {
        const topSust = Object.entries(data.substances).sort((x, y) => y[1] - x[1])[0]?.[0] || "Polirrubro";
        bunkerNodes.push({
          id: `bunker-${addr.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          label: addr,
          category: "bunker",
          count: data.count,
          x: 0,
          y: 0,
          color: "#f59e0b",
          description: `Búnker / Punto de venta denunciado ${data.count} veces. ${data.armed > 0 ? `🚨 ${data.armed} alertas con disparos o armas.` : ""}`,
          degree: 0,
          isArmed: data.armed > 0,
          dominantSubstance: topSust,
          cliqueId: data.clique || "general",
          address: addr,
          barrio: data.barrio || "José C. Paz",
          coords: data.coords,
          incidents: data.calls
        });
      });

    // Central Pillar Nodes (Substances & Weapons)
    const pillarNodes: GraphNode[] = [
      {
        id: "substance-cocaina",
        label: "Cocaína / Clorhidrato",
        category: "substance",
        count: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("COCA")).length,
        x: 550,
        y: 330,
        color: "#10b981",
        description: "Sustancia de mayor valor y prevalencia en venta tipo búnker.",
        degree: 0,
        incidents: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("COCA"))
      },
      {
        id: "substance-paco",
        label: "Paco / Pasta Base",
        category: "substance",
        count: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("PACO")).length,
        x: 450,
        y: 370,
        color: "#14b8a6",
        description: "Comercialización fraccionada en pasillos y casillas de asentamientos.",
        degree: 0,
        incidents: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("PACO"))
      },
      {
        id: "substance-marihuana",
        label: "Marihuana / Flores",
        category: "substance",
        count: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("MARI")).length,
        x: 650,
        y: 370,
        color: "#84cc16",
        description: "Distribución complementaria en vía pública y kioscos.",
        degree: 0,
        incidents: incidents.filter((i) => (i.sustancia || "").toUpperCase().includes("MARI"))
      },
      {
        id: "weapon-armas",
        label: "Armas de Fuego & Balaceras",
        category: "weapon",
        count: incidents.filter((i) => i.tieneArmas || i.Tiene_Armas).length,
        x: 550,
        y: 430,
        color: "#ef4444",
        description: "Conflictividad armada vinculada a disputa territorial, soldaditos y ajuste.",
        degree: 0,
        isArmed: true,
        incidents: incidents.filter((i) => i.tieneArmas || i.Tiene_Armas)
      }
    ];

    // Combine candidate nodes
    const candidateNodes = [...pillarNodes, ...suspectNodes, ...bunkerNodes];
    const nodeLookup = new Map(candidateNodes.map((n) => [n.id, n]));

    // B. Build Edges (Co-occurrences)
    const edgeMap: Record<string, GraphEdge> = {};

    incidents.forEach((inc) => {
      const rel = inc.relato || inc.Relato || "";
      const addr = (inc.direccion || inc.Dirección || inc.calle || "").trim();
      const isArmed = Boolean(inc.tieneArmas || inc.Tiene_Armas);
      const sustUpper = (inc.sustancia || inc.SubTipo || "").toUpperCase();
      const aliases = (inc.alias || inc.Alias_Identificados || []).map((a: string) => a.trim());

      const matchedSuspectNodes = candidateNodes.filter(
        (n) => n.category === "suspect" && aliases.some((al: string) => al.toLowerCase() === n.label.toLowerCase())
      );
      const matchedBunkerNode = candidateNodes.find((n) => n.category === "bunker" && n.label.toLowerCase() === addr.toLowerCase());

      // 1. Suspect <-> Bunker edge
      if (matchedBunkerNode && matchedSuspectNodes.length > 0) {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__${matchedBunkerNode.id}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: matchedBunkerNode.id,
              weight: 0,
              label: "Operación en Búnker",
              type: "suspect-bunker"
            };
          }
          edgeMap[edgeId].weight += 1;
        });
      }

      // 2. Suspect <-> Suspect edge (Co-cited in same call)
      for (let i = 0; i < matchedSuspectNodes.length; i++) {
        for (let j = i + 1; j < matchedSuspectNodes.length; j++) {
          const u = matchedSuspectNodes[i].id;
          const v = matchedSuspectNodes[j].id;
          const pairKey = u < v ? `${u}__${v}` : `${v}__${u}`;
          if (!edgeMap[pairKey]) {
            edgeMap[pairKey] = {
              id: pairKey,
              source: u < v ? u : v,
              target: u < v ? v : u,
              weight: 0,
              label: "Co-mención en Despacho 911",
              type: "suspect-suspect"
            };
          }
          edgeMap[pairKey].weight += 1;
        }
      }

      // 3. Suspect / Bunker <-> Substance edge
      const relevantSubstances: string[] = [];
      if (sustUpper.includes("COCA")) relevantSubstances.push("substance-cocaina");
      if (sustUpper.includes("PACO")) relevantSubstances.push("substance-paco");
      if (sustUpper.includes("MARI")) relevantSubstances.push("substance-marihuana");

      relevantSubstances.forEach((subId) => {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__${subId}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: subId,
              weight: 0,
              label: "Comercio de Sustancia",
              type: "suspect-substance"
            };
          }
          edgeMap[edgeId].weight += 1;
        });
        if (matchedBunkerNode) {
          const edgeId = `${matchedBunkerNode.id}__${subId}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: matchedBunkerNode.id,
              target: subId,
              weight: 0,
              label: "Punto de Venta de Sustancia",
              type: "bunker-substance"
            };
          }
          edgeMap[edgeId].weight += 1;
        }
      });

      // 4. Suspect / Bunker <-> Weapon edge
      if (isArmed) {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__weapon-armas`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: "weapon-armas",
              weight: 0,
              label: "Portación / Disparos",
              type: "suspect-weapon"
            };
          }
          edgeMap[edgeId].weight += 1;
        });
        if (matchedBunkerNode) {
          const edgeId = `${matchedBunkerNode.id}__weapon-armas`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: matchedBunkerNode.id,
              target: "weapon-armas",
              weight: 0,
              label: "Búnker con Conflicto Armado",
              type: "bunker-weapon"
            };
          }
          edgeMap[edgeId].weight += 1;
        }
      }
    });

    const edgesList = Object.values(edgeMap);

    // Compute node degrees
    edgesList.forEach((e) => {
      const src = nodeLookup.get(e.source);
      const tgt = nodeLookup.get(e.target);
      if (src) src.degree += 1;
      if (tgt) tgt.degree += 1;
    });

    // Deterministic Layout Positioning by Radial Sectors & Clusters
    const clusterAngles: Record<string, { angle: number; radius: number }> = {
      "sol-y-verde": { angle: (210 * Math.PI) / 180, radius: 280 },
      "porta-berni": { angle: (270 * Math.PI) / 180, radius: 300 },
      "palomero": { angle: (330 * Math.PI) / 180, radius: 290 },
      "coliqueo": { angle: (30 * Math.PI) / 180, radius: 270 },
      "fournier": { angle: (90 * Math.PI) / 180, radius: 280 },
      "lamas": { angle: (150 * Math.PI) / 180, radius: 290 },
      "general": { angle: 0, radius: 340 }
    };

    const clusterCounters: Record<string, number> = {};

    candidateNodes.forEach((node) => {
      // If pillar node, keep center
      if (node.category === "substance" || node.category === "weapon") {
        return;
      }
      const c = node.cliqueId || "general";
      const config = clusterAngles[c] || clusterAngles.general;
      const idx = clusterCounters[c] || 0;
      clusterCounters[c] = idx + 1;

      // Spiral scatter around cluster center
      const clusterCenterX = 550 + Math.cos(config.angle) * config.radius;
      const clusterCenterY = 380 + Math.sin(config.angle) * config.radius;

      const subAngle = (idx * 0.9) + config.angle;
      const subRadius = 40 + (idx * 16) % 110;

      node.x = Math.round(clusterCenterX + Math.cos(subAngle) * subRadius);
      node.y = Math.round(clusterCenterY + Math.sin(subAngle) * subRadius);

      // Clamp within SVG boundaries
      node.x = Math.max(70, Math.min(1030, node.x));
      node.y = Math.max(60, Math.min(700, node.y));
    });

    return { allNodes: candidateNodes, allEdges: edgesList };
  }, [incidents]);

  // -------------------------------------------------------------
  // 2. FILTERING & ACTIVE NODES COMPUTATION
  // -------------------------------------------------------------
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let nodes = allNodes;

    // Filter by Clique
    if (selectedClique !== "all") {
      nodes = nodes.filter(
        (n) => n.cliqueId === selectedClique || n.category === "substance" || n.category === "weapon"
      );
    }

    // Filter by Category
    if (filterCategory !== "all") {
      nodes = nodes.filter((n) => n.category === filterCategory);
    }

    // Filter by Min Connections
    if (minConnections > 1) {
      nodes = nodes.filter((n) => n.degree >= minConnections);
    }

    // Filter by Search Term
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const directMatches = new Set(
        nodes
          .filter((n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q))
          .map((n) => n.id)
      );

      // Also include 1-hop neighbors of matched nodes
      const neighborMatches = new Set<string>(directMatches);
      allEdges.forEach((e) => {
        if (directMatches.has(e.source)) neighborMatches.add(e.target);
        if (directMatches.has(e.target)) neighborMatches.add(e.source);
      });

      nodes = nodes.filter((n) => neighborMatches.has(n.id));
    }

    const activeNodeIds = new Set(nodes.map((n) => n.id));

    // Filter edges connecting active nodes
    const edges = allEdges.filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [allNodes, allEdges, selectedClique, filterCategory, minConnections, searchTerm]);

  // Merge custom dragged positions
  const displayNodes = useMemo(() => {
    return filteredNodes.map((n) => {
      const custom = customPositions[n.id];
      if (custom) {
        return { ...n, x: custom.x, y: custom.y };
      }
      return n;
    });
  }, [filteredNodes, customPositions]);

  const displayNodeMap = useMemo(() => {
    return new Map(displayNodes.map((n) => [n.id, n]));
  }, [displayNodes]);

  // Selected Node Details
  const activeSelectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return displayNodeMap.get(selectedNodeId) || allNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, displayNodeMap, allNodes]);

  // Connected Neighbors for Selected Node
  const selectedNodeNeighbors = useMemo(() => {
    if (!activeSelectedNode) return [];
    const neighbors: Array<{ node: GraphNode; edge: GraphEdge }> = [];
    allEdges.forEach((e) => {
      if (e.source === activeSelectedNode.id) {
        const tgt = displayNodeMap.get(e.target) || allNodes.find((n) => n.id === e.target);
        if (tgt) neighbors.push({ node: tgt, edge: e });
      } else if (e.target === activeSelectedNode.id) {
        const src = displayNodeMap.get(e.source) || allNodes.find((n) => n.id === e.source);
        if (src) neighbors.push({ node: src, edge: e });
      }
    });
    return neighbors.sort((a, b) => b.edge.weight - a.edge.weight);
  }, [activeSelectedNode, allEdges, displayNodeMap, allNodes]);

  // Metrics for active view
  const metrics = useMemo(() => {
    const totalNodes = displayNodes.length;
    const totalEdges = filteredEdges.length;
    const suspectsCount = displayNodes.filter((n) => n.category === "suspect").length;
    const bunkersCount = displayNodes.filter((n) => n.category === "bunker").length;
    const armedCount = displayNodes.filter((n) => n.isArmed).length;
    const armedRate = totalNodes > 0 ? (armedCount / totalNodes) * 100 : 0;
    return { totalNodes, totalEdges, suspectsCount, bunkersCount, armedRate };
  }, [displayNodes, filteredEdges]);

  // -------------------------------------------------------------
  // 3. MOUSE, ZOOM & PAN HANDLERS
  // -------------------------------------------------------------
  const handleZoomIn = () => setZoomScale((z) => Math.min(z + 0.25, 3.5));
  const handleZoomOut = () => setZoomScale((z) => Math.max(z - 0.25, 0.35));
  const handleResetView = () => {
    setZoomScale(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomScale((z) => Math.max(0.35, Math.min(3.5, z + delta)));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background
    if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).tagName === "rect") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    const node = displayNodeMap.get(nodeId);
    if (node) {
      nodeDragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        nodeX: node.x,
        nodeY: node.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNodeId) {
      const dx = (e.clientX - nodeDragStartRef.current.mouseX) / zoomScale;
      const dy = (e.clientY - nodeDragStartRef.current.mouseY) / zoomScale;
      setCustomPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(nodeDragStartRef.current.nodeX + dx),
          y: Math.round(nodeDragStartRef.current.nodeY + dy)
        }
      }));
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleFocusNode = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    // Smoothly center the node in viewport
    const targetCenterX = 550;
    const targetCenterY = 375;
    setPanOffset({
      x: (targetCenterX - node.x) * zoomScale,
      y: (targetCenterY - node.y) * zoomScale
    });
  };

  // -------------------------------------------------------------
  // 4. EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleExportCSV = () => {
    const nodeExport = displayNodes.map((n) => ({
      ID: n.id,
      Nombre: n.label,
      Categoria: n.category,
      Llamados_911: n.count,
      Grado_Conexiones: n.degree,
      Sustancia_Dominante: n.dominantSubstance || "N/D",
      Involucra_Armas: n.isArmed ? "SI" : "NO",
      Foco_Banda: n.cliqueId || "general",
      Direccion: n.address || n.barrio || ""
    }));
    exportToCSV(`grafo_narcocriminal_jcp_${selectedClique}`, nodeExport);
  };

  const handleExportPDF = () => {
    const activeCliqueLabel = CLIQUE_PRESETS.find((c) => c.id === selectedClique)?.label || "Red General";
    const sampleCalls = activeSelectedNode ? activeSelectedNode.incidents : displayNodes.flatMap((n) => n.incidents).slice(0, 30);

    generateDrogasGraphPDF({
      cliqueName: activeCliqueLabel,
      partido: "José C. Paz",
      nodes: displayNodes.map((n) => ({
        id: n.id,
        label: n.label,
        category:
          n.category === "suspect"
            ? "Sospechoso / Investigado"
            : n.category === "bunker"
            ? "Punto de Venta / Búnker"
            : n.category === "weapon"
            ? "Armamento / Disparos"
            : n.category === "substance"
            ? "Sustancia Ilícita"
            : n.category,
        count: n.count,
        degree: n.degree,
        address: n.address,
        barrio: n.barrio,
        dominantSubstance: n.dominantSubstance,
        isArmed: n.isArmed,
        description: n.description
      })),
      edges: filteredEdges.map((e) => ({
        source: displayNodeMap.get(e.source)?.label || e.source,
        target: displayNodeMap.get(e.target)?.label || e.target,
        weight: e.weight,
        label: e.label
      })),
      dispatches: sampleCalls,
      metrics
    });
  };

  const handleCopyFicha = () => {
    if (!activeSelectedNode) return;
    const catLabel =
      activeSelectedNode.category === "suspect"
        ? "Sospechoso / Investigado"
        : activeSelectedNode.category === "bunker"
        ? "Punto de Venta / Búnker"
        : activeSelectedNode.category === "substance"
        ? "Sustancia Ilícita"
        : "Armamento / Disparos";
    const text = `FICHA INTELIGENCIA MSEG\nEntidad: ${activeSelectedNode.label}\nCategoría: ${catLabel}\nDespachos 911: ${activeSelectedNode.count}\nConexiones: ${activeSelectedNode.degree}\nSustancia: ${activeSelectedNode.dominantSubstance || 'N/D'}\nArmas: ${activeSelectedNode.isArmed ? 'SI' : 'NO'}\nDirección: ${activeSelectedNode.address || activeSelectedNode.barrio || 'José C. Paz'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* ─── HEADER BANNER ─── */}
      <div
        className="card"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          borderLeft: "4px solid #ef4444",
          padding: "1.1rem 1.35rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(239, 68, 68, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#dc2626",
                border: "1px solid rgba(239, 68, 68, 0.25)"
              }}
            >
              <Share2 size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 600, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
                  Grafo Relacional & Inteligencia de Bandas Narcocriminales
                </h2>
                <span style={{ fontSize: "11px", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)", padding: "2px 8px", borderRadius: "var(--radius-xs)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  EJE 2 FORENSE · JOSÉ C. PAZ
                </span>
              </div>
              <p style={{ margin: "0.25rem 0 0", fontSize: "13.5px", color: "var(--text-muted)" }}>
                Modelado topológico de co-ocurrencia: Sospechosos/Alias &harr; Puntos de Venta/Búnkers &harr; Sustancias &harr; Conflictividad Armada (1.770 llamados 911).
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              onClick={handleExportCSV}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} />
              Exportar Red (CSV)
            </button>

            <button
              onClick={handleExportPDF}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
            >
              <FileText size={14} />
              Expediente de Red (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI METRICS BAR ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.85rem" }}>
        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #6366f1" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Nodos Visibles</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.2rem" }}>
            {metrics.totalNodes} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>de {allNodes.length}</span>
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #38bdf8" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Vínculos Activos</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#38bdf8", marginTop: "0.2rem" }}>
            {metrics.totalEdges} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>conexiones</span>
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Sospechosos / Alias</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#a78bfa", marginTop: "0.2rem" }}>
            {metrics.suspectsCount}
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Búnkers / Kioscos</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.2rem" }}>
            {metrics.bunkersCount}
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Tasa de Conflicto Armado</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171", marginTop: "0.2rem" }}>
            {metrics.armedRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ─── CLIQUE PRESET BUTTONS (CLUSTERS) ─── */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Target size={14} /> Focos Criminales / Bandas Territoriales Detectadas en José C. Paz:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {CLIQUE_PRESETS.map((preset) => {
            const isActive = selectedClique === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedClique(preset.id);
                  // Default focus on first node of the clique if available
                  const firstOfClique = allNodes.find((n) => n.cliqueId === preset.id);
                  if (firstOfClique) handleFocusNode(firstOfClique);
                }}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: isActive ? `1.5px solid ${preset.color}` : "1px solid var(--border)",
                  background: isActive ? `${preset.color}22` : "var(--bg-base)",
                  color: isActive ? preset.color : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── TOOLBAR CONTROLS: SEARCH & FILTERS ─── */}
      <div className="card" style={{ padding: "0.85rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          {/* Quick Search */}
          <div style={{ position: "relative", minWidth: "280px", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar alias, esquina, búnker o sustancia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2.25rem",
                fontSize: "0.82rem",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg-base)",
                color: "var(--text-primary)"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>Categoría:</span>
            {[
              { id: "all", label: "Todas" },
              { id: "suspect", label: "🟣 Sospechosos" },
              { id: "bunker", label: "📍 Búnkers" },
              { id: "substance", label: "💊 Sustancias" },
              { id: "weapon", label: "🔫 Armas" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  borderRadius: "5px",
                  border: filterCategory === cat.id ? "1px solid var(--accent-indigo)" : "1px solid var(--border)",
                  background: filterCategory === cat.id ? "rgba(99,102,241,0.15)" : "var(--bg-base)",
                  color: filterCategory === cat.id ? "var(--accent-indigo)" : "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Min Connections Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)" }}>
              Conexiones mín: <strong style={{ color: "var(--text-primary)" }}>{minConnections}</strong>
            </span>
            <input
              type="range"
              min="1"
              max="6"
              value={minConnections}
              onChange={(e) => setMinConnections(Number(e.target.value))}
              style={{ width: "80px", cursor: "pointer" }}
            />
          </div>

          {/* Viewport Zoom Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <button
              onClick={handleZoomIn}
              title="Acercar (Zoom +)"
              style={{ padding: "0.4rem", borderRadius: "5px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Alejar (Zoom -)"
              style={{ padding: "0.4rem", borderRadius: "5px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={handleResetView}
              title="Reiniciar Vista"
              style={{ padding: "0.4rem", borderRadius: "5px", background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-primary)", cursor: "pointer" }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── GRAPH MAIN CONTAINER (SVG CANVAS + SIDE DRAWER) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: activeSelectedNode ? "1fr 400px" : "1fr", gap: "1.25rem", minHeight: "680px" }}>
        {/* SVG INTERACTIVE GRAPH VIEWPORT */}
        <div
          className="card"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: 0,
            background: "#020617",
            border: "1px solid #1e293b",
            height: "720px",
            userSelect: "none"
          }}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Floating Instructions Banner */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "14px",
              zIndex: 10,
              background: "rgba(15,23,42,0.85)",
              backdropFilter: "blur(6px)",
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #334155",
              fontSize: "0.73rem",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: "none"
            }}
          >
            <Move size={13} color="#60a5fa" />
            <span>
              <strong>Interactividad:</strong> Arrastrá nodos para reorganizar · Rueda para zoom · Clic para ficha pericial
            </span>
          </div>

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 1100 750"
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="grid-dots" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="#334155" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dots)" />

            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
              {/* EDGES (VÍNCULOS) */}
              {filteredEdges.map((edge) => {
                const src = displayNodeMap.get(edge.source);
                const tgt = displayNodeMap.get(edge.target);
                if (!src || !tgt) return null;

                const isConnectedToSelected =
                  activeSelectedNode && (edge.source === activeSelectedNode.id || edge.target === activeSelectedNode.id);

                const strokeWidth = Math.min(6, Math.max(1.5, Math.sqrt(edge.weight) * 1.6));
                let strokeColor = "#334155";
                let strokeOpacity = 0.45;

                if (isConnectedToSelected) {
                  strokeColor = "#818cf8";
                  strokeOpacity = 0.95;
                } else if (edge.type === "suspect-suspect") {
                  strokeColor = "#c084fc";
                  strokeOpacity = 0.65;
                } else if (edge.type === "suspect-weapon" || edge.type === "bunker-weapon") {
                  strokeColor = "#f87171";
                  strokeOpacity = 0.6;
                } else if (edge.type === "suspect-substance" || edge.type === "bunker-substance") {
                  strokeColor = "#34d399";
                  strokeOpacity = 0.55;
                }

                // Curved bezier path
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const cx = (src.x + tgt.x) / 2 - dy * 0.08;
                const cy = (src.y + tgt.y) / 2 + dx * 0.08;

                return (
                  <g key={edge.id}>
                    <path
                      d={`M ${src.x} ${src.y} Q ${cx} ${cy} ${tgt.x} ${tgt.y}`}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      fill="none"
                    />
                    {edge.weight > 2 && (
                      <text
                        x={cx}
                        y={cy}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                        style={{ pointerEvents: "none" }}
                      >
                        {edge.weight}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* NODES (ACTORES & PUNTOS) */}
              {displayNodes.map((node) => {
                const isSelected = activeSelectedNode?.id === node.id;
                const radius = Math.min(34, Math.max(16, 14 + Math.sqrt(node.count) * 2.8));

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: "pointer" }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  >
                    {/* Selection Outer Halo */}
                    {isSelected && (
                      <circle
                        r={radius + 8}
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="3"
                        strokeDasharray="4 3"
                        opacity="0.9"
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      r={radius}
                      fill={node.color}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 3 : 1.5}
                      fillOpacity={0.92}
                    />

                    {/* Node Glyphs / Icons inside circle */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize={radius > 20 ? "13" : "10"}
                      fontWeight="800"
                      style={{ pointerEvents: "none" }}
                    >
                      {node.category === "suspect" ? "👤" : node.category === "bunker" ? "🏠" : node.category === "substance" ? "💊" : "⚡"}
                    </text>

                    {/* Node Text Label with Backdrop Pill */}
                    <g transform={`translate(0, ${radius + 14})`}>
                      <rect
                        x={-(node.label.length * 3.3) - 6}
                        y="-8"
                        width={node.label.length * 6.6 + 12}
                        height="16"
                        rx="4"
                        fill="rgba(15,23,42,0.85)"
                        stroke={isSelected ? "#60a5fa" : "#334155"}
                        strokeWidth="0.75"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isSelected ? "#93c5fd" : "#f1f5f9"}
                        fontSize="9.5"
                        fontWeight={isSelected ? "800" : "600"}
                      >
                        {node.label.length > 26 ? node.label.substring(0, 24) + "…" : node.label}
                      </text>
                    </g>

                    {/* Call Counter Badge */}
                    <circle
                      cx={radius * 0.7}
                      cy={-radius * 0.7}
                      r="9"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                    <text
                      x={radius * 0.7}
                      y={-radius * 0.7}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#f8fafc"
                      fontSize="8.5"
                      fontWeight="800"
                    >
                      {node.count}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* ─── FORENSIC INTELLIGENCE SIDE DRAWER ─── */}
        {activeSelectedNode && (
          <div
            className="card"
            style={{
              padding: "1.25rem",
              background: "#ffffff",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxHeight: "720px",
              overflowY: "auto"
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: activeSelectedNode.color,
                    color: "#ffffff"
                  }}
                >
                  {activeSelectedNode.category === "suspect" ? "👤 SOSPECHOSO / TRANSA" : activeSelectedNode.category === "bunker" ? "🏠 BÚNKER / PUNTO DE VENTA" : activeSelectedNode.category === "substance" ? "💊 SUSTANCIA" : "⚡ FACTOR DE VIOLENCIA"}
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.4rem 0 0.1rem" }}>
                  {activeSelectedNode.label}
                </h3>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {activeSelectedNode.address || activeSelectedNode.barrio || "Partido de José C. Paz"}
                </div>
              </div>

              <button
                onClick={() => setSelectedNodeId(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                title="Cerrar panel"
              >
                <X size={18} />
              </button>
            </div>

            {/* Entity Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Despachos 911</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{activeSelectedNode.count}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Vínculos Directos</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-pba-blue)" }}>{activeSelectedNode.degree}</div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Conflictividad Armada</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: activeSelectedNode.isArmed ? "#dc2626" : "#059669" }}>
                  {activeSelectedNode.isArmed ? "⚠️ Con Armas" : "Sin Disparos"}
                </div>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Sustancia Clave</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#059669", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeSelectedNode.dominantSubstance || "Cocaína / Paco"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={handleCopyFicha}
                style={{
                  flex: 1,
                  padding: "0.45rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "5px",
                  background: "#f8fafc",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem"
                }}
              >
                {copiedId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                <span>{copiedId ? "Copiado!" : "Copiar Ficha"}</span>
              </button>

              <button
                onClick={() => handleFocusNode(activeSelectedNode)}
                style={{
                  flex: 1,
                  padding: "0.45rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "5px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem"
                }}
              >
                <Crosshair size={14} />
                <span>Centrar Nodo</span>
              </button>
            </div>

            {/* Connected Neighbors (Pills) */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                🔗 Nodos Conectados ({selectedNodeNeighbors.length}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {selectedNodeNeighbors.map(({ node, edge }) => (
                  <button
                    key={node.id}
                    onClick={() => handleFocusNode(node)}
                    style={{
                      padding: "0.3rem 0.6rem",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      borderRadius: "4px",
                      background: "#f8fafc",
                      border: `1px solid #cbd5e1`,
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem"
                    }}
                  >
                    <span style={{ color: node.color }}>●</span>
                    <span>{node.label}</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>({edge.weight})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* List of Linked 911 Calls with FULL TEXT (Sin Truncar) */}
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                📑 Despachos 911 Vinculados ({activeSelectedNode.incidents.length} Registros Íntegros):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {activeSelectedNode.incidents.slice(0, 15).map((inc, i) => (
                  <div
                    key={inc.id || inc.ID || i}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--border)",
                      borderLeft: `4px solid ${inc.tieneArmas ? '#dc2626' : '#0d5ca8'}`,
                      borderRadius: "4px",
                      padding: "0.6rem 0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      <span><strong>#{inc.id || inc.ID}</strong> · {inc.fecha || inc.Fecha}</span>
                      <span style={{ color: inc.tieneArmas ? "#dc2626" : "#059669", fontWeight: 700 }}>
                        {inc.tieneArmas ? "⚠️ Armas" : "Sin Armas"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                      📍 <strong>{inc.direccion || inc.Dirección || "José C. Paz"}</strong>
                      {inc.barrio && <span style={{ color: "var(--text-muted)" }}> ({inc.barrio})</span>}
                    </div>

                    {/* UNTRUNCATED POLICE NARRATIVE */}
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "0.55rem 0.65rem",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontFamily: "ui-monospace, monospace",
                        color: "var(--text-primary)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        lineHeight: 1.45,
                        border: "1px solid #cbd5e1"
                      }}
                    >
                      {inc.relato || inc.Relato || "(Sin transcripción disponible)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
