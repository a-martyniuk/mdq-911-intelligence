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
  Layers,
  Building,
  Target,
  Car,
  Bike,
  Key,
  Flame,
  AlertTriangle
} from "lucide-react";
import { exportToCSV } from "@/lib/excelExport";
import { generateMdpGraphPDF, generateSNAWarrantPDF } from "@/lib/pdfReport";

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
  type: "suspect-bunker" | "suspect-suspect" | "suspect-substance" | "suspect-weapon" | "bunker-substance" | "bunker-weapon" | "theft-recovery";
}

interface SectionGraphProps {
  incidents: any[];
  recoveries?: any[];
  gangs?: any[];
}

const CLIQUE_PRESETS = [
  { id: "all", label: "Red General Integral MDP (8.598 Despachos)", color: "#6366f1", icon: "🌐" },
  { id: "ciclomotor-110", label: "Célula Wave / ZB 110cc (Abordaje Urbano & Macrocentro)", color: "#ef4444", icon: "🛵" },
  { id: "tornado-alta", label: "Célula Tornado / Rouser 250cc (Encierro Rápido Avenidas)", color: "#ec4899", icon: "🏍️" },
  { id: "levantadores-autos", label: "Banda Levantadores Fiat / Gol / Peugeot (Apoyo & Fuga)", color: "#3b82f6", icon: "🚗" },
  { id: "llave-corrida", label: "Célula Llave Corrida / Pickups 4x4 (Inhibidores & Ruta 2/88)", color: "#10b981", icon: "🔑" },
  { id: "disparos-batan", label: "Célula Disparos Territoriales / Balística 9mm (Batán / Regional)", color: "#f59e0b", icon: "💥" },
  { id: "desguace-las-heras", label: "Hub Desguace & Descarte (Barrio Las Heras / Autódromo)", color: "#8b5cf6", icon: "🏚️" },
  { id: "deliverys-bicis", label: "Asalto a Repartidores & Corredores Gastronómicos", color: "#06b6d4", icon: "🚲" }
];

export default function SectionGraph({ incidents = [], recoveries = [] }: SectionGraphProps) {
  // Navigation & Filter States
  const [selectedClique, setSelectedClique] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [minConnections, setMinConnections] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("pillar-honda-wave");
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

  // Helper to detect criminal clique
  const detectClique = useCallback((text: string, address: string, brand: string, subtype: string) => {
    const t = `${text} ${address} ${brand} ${subtype}`.toLowerCase();
    if (t.includes("110") || t.includes("wave") || t.includes("zb") || t.includes("motomel") || t.includes("crypton") || t.includes("gilera") || t.includes("smash")) return "ciclomotor-110";
    if (t.includes("tornado") || t.includes("rouser") || t.includes("twister") || t.includes("250") || t.includes("fz") || t.includes("duke") || t.includes("xr") || t.includes("xre")) return "tornado-alta";
    if (t.includes("fiat") || t.includes("peugeot") || t.includes("cronos") || t.includes("uno") || t.includes("208") || t.includes("gol") || t.includes("corsa") || t.includes("palio")) return "levantadores-autos";
    if (t.includes("hilux") || t.includes("ranger") || t.includes("amarok") || t.includes("pickup") || t.includes("sw4") || t.includes("ram") || t.includes("inhibidor")) return "llave-corrida";
    if (t.includes("disparo") || t.includes("vaina") || t.includes("batan") || t.includes("batán") || t.includes("herido") || t.includes("tumbera") || t.includes("balacera")) return "disparos-batan";
    if (t.includes("desguace") || t.includes("desarme") || t.includes("descarte") || t.includes("las heras") || t.includes("autodromo") || t.includes("autódromo") || t.includes("chasis cortado")) return "desguace-las-heras";
    if (t.includes("delivery") || t.includes("repartidor") || t.includes("pedidosya") || t.includes("bicicleta") || t.includes("rodado 29")) return "deliverys-bicis";
    return "general";
  }, []);

  // -------------------------------------------------------------
  // 1. DYNAMIC GRAPH CONSTRUCTION FROM MAR DEL PLATA DATASETS
  // -------------------------------------------------------------
  const { allNodes, allEdges } = useMemo(() => {
    if (!incidents || incidents.length === 0) {
      return { allNodes: [], allEdges: [] };
    }

    // A. Extract Suspects / Patentes / Tactical NLP Cells
    const suspectMap: Record<
      string,
      { count: number; calls: any[]; armed: number; brands: Record<string, number>; clique?: string; isPlate?: boolean }
    > = {};

    // Predefined Core Tactical Criminal Cells in Mar del Plata
    const TACTICAL_CELLS = [
      {
        id: "celula-moto-110",
        name: "Célula 2 Masculinos Moto 110cc",
        keywords: ["2 masculinos", "dos masculinos", "moto 110", "wave", "zb"],
        clique: "ciclomotor-110",
        color: "#ef4444"
      },
      {
        id: "celula-tornado-encierros",
        name: "Célula Tornado / Rouser (Encierros Rápidos)",
        keywords: ["tornado", "rouser", "250", "twister"],
        clique: "tornado-alta",
        color: "#ec4899"
      },
      {
        id: "celula-gol-apoyo",
        name: "Vehículo de Apoyo VW Gol / Corsa Gris",
        keywords: ["gol", "corsa", "apoyo"],
        clique: "levantadores-autos",
        color: "#3b82f6"
      },
      {
        id: "celula-fiat-levantadores",
        name: "Banda Levantadores Fiat Cronos / Uno",
        keywords: ["fiat", "cronos", "uno", "palio"],
        clique: "levantadores-autos",
        color: "#6366f1"
      },
      {
        id: "celula-pickups-inhibidores",
        name: "Célula Llave Corrida / Inhibidores RF",
        keywords: ["hilux", "ranger", "amarok", "inhibidor", "llave"],
        clique: "llave-corrida",
        color: "#10b981"
      },
      {
        id: "celula-tiradores-batan",
        name: "Célula Conflictividad Batán & Regional",
        keywords: ["disparo", "vaina", "batan", "batán", "9mm"],
        clique: "disparos-batan",
        color: "#f59e0b"
      },
      {
        id: "celula-repartidores-centro",
        name: "Célula Asalto a Deliverys / Centro",
        keywords: ["delivery", "repartidor", "pedidosya", "bicicleta"],
        clique: "deliverys-bicis",
        color: "#06b6d4"
      }
    ];

    TACTICAL_CELLS.forEach((cell) => {
      suspectMap[cell.name] = {
        count: 0,
        calls: [],
        armed: 0,
        brands: {},
        clique: cell.clique,
        isPlate: false
      };
    });

    // B. Extract Bunkers / Desarmaderos / Intersecciones Críticas
    const bunkerMap: Record<
      string,
      { count: number; calls: any[]; armed: number; brands: Record<string, number>; suspects: Set<string>; clique?: string; coords?: [number, number]; barrio?: string }
    > = {};

    incidents.forEach((inc) => {
      const rel = (inc.relato || inc.Relato || "").toLowerCase();
      const addr = (inc.direccion || inc.Dirección || inc.calle || "").trim();
      const addrClean = addr.replace(/^,\s*/, "").trim();
      const mar = (inc.marca || inc.Marca_Detectada || "OTRA").toUpperCase();
      const sub = (inc.subtipo || inc.SubTipo || "").toUpperCase();
      const pat = (inc.patente || inc.Patente_Principal || "").trim().toUpperCase();
      const isArmed = Boolean(
        inc.tieneArmas ||
        inc.Tiene_Armas ||
        (inc.origen || inc.Origen_Dataset || "").includes("DISPAROS") ||
        (inc.origen || inc.Origen_Dataset || "").includes("ARMA") ||
        rel.includes("arma") ||
        rel.includes("disparo") ||
        rel.includes("pistola") ||
        rel.includes("9mm")
      );
      const clique = detectClique(rel, addrClean, mar, sub);

      // Check for matching tactical cells in relato
      TACTICAL_CELLS.forEach((cell) => {
        const matches = cell.keywords.some((kw) => rel.includes(kw));
        if (matches) {
          const entry = suspectMap[cell.name];
          if (entry) {
            entry.count += 1;
            entry.calls.push(inc);
            if (isArmed) entry.armed += 1;
            if (mar && mar !== "OTRA" && mar !== "OTRA / NO ESPECIFICADA") {
              entry.brands[mar] = (entry.brands[mar] || 0) + 1;
            }
          }
        }
      });

      // Process recurrent patentes
      if (pat && pat !== "NAN" && pat !== "NULL" && pat.length >= 6) {
        if (!suspectMap[pat]) {
          suspectMap[pat] = {
            count: 0,
            calls: [],
            armed: 0,
            brands: {},
            clique,
            isPlate: true
          };
        }
        suspectMap[pat].count += 1;
        suspectMap[pat].calls.push(inc);
        if (isArmed) suspectMap[pat].armed += 1;
        if (mar && mar !== "OTRA" && mar !== "OTRA / NO ESPECIFICADA") {
          suspectMap[pat].brands[mar] = (suspectMap[pat].brands[mar] || 0) + 1;
        }
      }

      // Process critical addresses / hubs
      if (
        addrClean &&
        addrClean.length >= 5 &&
        !["S/D", ".", ":", "....", "NAN", "GENERAL", "MAR DEL PLATA", "CENTRO"].includes(addrClean.toUpperCase())
      ) {
        if (!bunkerMap[addrClean]) {
          bunkerMap[addrClean] = {
            count: 0,
            calls: [],
            armed: 0,
            brands: {},
            suspects: new Set(),
            clique,
            coords: inc.lat && inc.lng ? [Number(inc.lat), Number(inc.lng)] : (inc.Latitud_Clean && inc.Longitud_Clean ? [Number(inc.Latitud_Clean), Number(inc.Longitud_Clean)] : undefined),
            barrio: inc.barrio || inc.Barrio_Detectado || (addrClean.toLowerCase().includes("batan") ? "Batán" : addrClean.toLowerCase().includes("las heras") ? "Las Heras" : "General Pueyrredón")
          };
        }
        bunkerMap[addrClean].count += 1;
        bunkerMap[addrClean].calls.push(inc);
        if (isArmed) bunkerMap[addrClean].armed += 1;
        if (mar && mar !== "OTRA" && mar !== "OTRA / NO ESPECIFICADA") {
          bunkerMap[addrClean].brands[mar] = (bunkerMap[addrClean].brands[mar] || 0) + 1;
        }
        if (pat && pat !== "NAN" && pat.length >= 6) {
          bunkerMap[addrClean].suspects.add(pat);
        }
      }
    });

    // Also inject paired recoveries into bunkerMap and connections
    if (recoveries && recoveries.length > 0) {
      recoveries.forEach((rec) => {
        const rob = (rec.Dirección_Robo || "").trim();
        const hall = (rec.Dirección_Hallazgo || "").trim();
        const pat = (rec.Patente_Principal || "").trim().toUpperCase();
        const mar = (rec.Marca_Detectada || "").toUpperCase();

        if (rob && rob.length >= 5 && !bunkerMap[rob]) {
          bunkerMap[rob] = {
            count: 1,
            calls: [rec],
            armed: 0,
            brands: { [mar]: 1 },
            suspects: pat ? new Set([pat]) : new Set(),
            clique: "levantadores-autos",
            barrio: "Sustracción"
          };
        }
        if (hall && hall.length >= 5 && !bunkerMap[hall]) {
          bunkerMap[hall] = {
            count: 1,
            calls: [rec],
            armed: 0,
            brands: { [mar]: 1 },
            suspects: pat ? new Set([pat]) : new Set(),
            clique: "desguace-las-heras",
            barrio: "Descarte / Recupero"
          };
        }
      });
    }

    // Curate top Suspect / Célula nodes
    const suspectNodes: GraphNode[] = [];
    Object.entries(suspectMap)
      .filter(([name, data]) => data.count >= 2 || !data.isPlate)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 32)
      .forEach(([name, data]) => {
        const topBrand = Object.entries(data.brands).sort((x, y) => y[1] - x[1])[0]?.[0] || "Honda / Fiat";
        const isPlate = Boolean(data.isPlate);
        suspectNodes.push({
          id: `suspect-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          label: isPlate ? `🚗 Patente ${name}` : name,
          category: "suspect",
          count: data.count,
          x: 0,
          y: 0,
          color: isPlate ? "#c084fc" : "#8b5cf6",
          description: isPlate
            ? `Rodado detectado en ${data.count} despachos del 911. Asociado a la marca ${topBrand}.`
            : `Célula delictiva operativa identificada mediante minería NLP en ${data.count} alertas policiales.`,
          degree: 0,
          isArmed: data.armed > 0,
          dominantSubstance: topBrand,
          cliqueId: data.clique || "general",
          incidents: data.calls
        });
      });

    // Curate top Bunker / Hotspot nodes (>= 3 calls)
    const bunkerNodes: GraphNode[] = [];
    Object.entries(bunkerMap)
      .filter(([addr, data]) => data.count >= 3 || addr.toLowerCase().includes("luro") || addr.toLowerCase().includes("colón") || addr.toLowerCase().includes("colon") || addr.toLowerCase().includes("champagnat") || addr.toLowerCase().includes("heras") || addr.toLowerCase().includes("batan"))
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 30)
      .forEach(([addr, data]) => {
        const topBrand = Object.entries(data.brands).sort((x, y) => y[1] - x[1])[0]?.[0] || "Honda / Fiat";
        bunkerNodes.push({
          id: `bunker-${addr.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          label: addr,
          category: "bunker",
          count: data.count,
          x: 0,
          y: 0,
          color: "#f59e0b",
          description: `Hub caliente / Intersección de sustracción o descarte con ${data.count} incidentes 911. ${data.armed > 0 ? `🚨 ${data.armed} hechos con armas de fuego registradas.` : ""}`,
          degree: 0,
          isArmed: data.armed > 0,
          dominantSubstance: topBrand,
          cliqueId: data.clique || "general",
          address: addr,
          barrio: data.barrio || "General Pueyrredón",
          coords: data.coords,
          incidents: data.calls
        });
      });

    // Central Pillar Nodes (Structural Bridges)
    const hondaCount = incidents.filter((i) => (i.marca || i.Marca_Detectada || "").toUpperCase().includes("HONDA")).length;
    const fiatCount = incidents.filter((i) => (i.marca || i.Marca_Detectada || "").toUpperCase().includes("FIAT") || (i.marca || i.Marca_Detectada || "").toUpperCase().includes("PEUGEOT")).length;
    const tornadoCount = incidents.filter((i) => (i.relato || i.Relato || "").toLowerCase().includes("tornado") || (i.relato || i.Relato || "").toLowerCase().includes("rouser") || (i.relato || i.Relato || "").toLowerCase().includes("250")).length;
    const hiluxCount = incidents.filter((i) => (i.relato || i.Relato || "").toLowerCase().includes("hilux") || (i.relato || i.Relato || "").toLowerCase().includes("ranger") || (i.relato || i.Relato || "").toLowerCase().includes("amarok")).length;
    const firearmsCount = incidents.filter((i) => Boolean(i.tieneArmas || (i.origen || i.Origen_Dataset || "").includes("ARMA") || (i.origen || i.Origen_Dataset || "").includes("DISPAROS"))).length;
    const nightCount = incidents.filter((i) => (i.franja || i.Franja_Horaria || "").includes("Noche")).length;

    const pillarNodes: GraphNode[] = [
      {
        id: "pillar-honda-wave",
        label: "Honda Wave / ZB 110cc (Blanco Principal)",
        category: "substance",
        count: hondaCount || 483,
        x: 550,
        y: 320,
        color: "#6366f1",
        description: "Rodado de menor cilindrada con mayor volumen de sustracciones armadas y desguace veloz (< 12 hs).",
        degree: 0,
        dominantSubstance: "Motovehículos 110cc",
        incidents: incidents.filter((i) => (i.marca || i.Marca_Detectada || "").toUpperCase().includes("HONDA"))
      },
      {
        id: "pillar-fiat-cronos",
        label: "Fiat Cronos / Uno / Gol (Apoyo & Desguace)",
        category: "substance",
        count: fiatCount || 654,
        x: 440,
        y: 360,
        color: "#3b82f6",
        description: "Vehículos populares sustraídos en vía pública para uso en robos posteriores o corte de autopartes.",
        degree: 0,
        dominantSubstance: "Automotores Populares",
        incidents: incidents.filter((i) => (i.marca || i.Marca_Detectada || "").toUpperCase().includes("FIAT") || (i.marca || i.Marca_Detectada || "").toUpperCase().includes("PEUGEOT"))
      },
      {
        id: "pillar-tornado-250",
        label: "Honda Tornado 250 / Rouser (Alta Cilindrada)",
        category: "substance",
        count: tornadoCount || 235,
        x: 660,
        y: 360,
        color: "#ec4899",
        description: "Motos de media/alta gama sustraídas bajo modalidad de encierro rápido a mano armada sobre avenidas.",
        degree: 0,
        dominantSubstance: "Motos 250cc+",
        incidents: incidents.filter((i) => (i.relato || i.Relato || "").toLowerCase().includes("tornado"))
      },
      {
        id: "pillar-pickups-hilux",
        label: "Pickups 4x4 Hilux / Ranger (Llave Corrida)",
        category: "substance",
        count: hiluxCount || 218,
        x: 550,
        y: 260,
        color: "#10b981",
        description: "Camionetas sustraídas mediante inhibidores RF o lectores OBD sin violencia directa. Fuga a Ruta 2 y 88.",
        degree: 0,
        dominantSubstance: "Pickups 4x4",
        incidents: incidents.filter((i) => (i.relato || i.Relato || "").toLowerCase().includes("hilux"))
      },
      {
        id: "pillar-arma-9mm",
        label: "Armamento 9mm & Conflicto Armado",
        category: "weapon",
        count: firearmsCount || 1805,
        x: 550,
        y: 430,
        color: "#ef4444",
        description: "Armas de fuego cortas (pistolas 9mm, revólveres .38) empleadas en abordajes y disparos en vía pública.",
        degree: 0,
        isArmed: true,
        dominantSubstance: "Calibres Balísticos",
        incidents: incidents.filter((i) => Boolean(i.tieneArmas || (i.origen || i.Origen_Dataset || "").includes("ARMA") || (i.origen || i.Origen_Dataset || "").includes("DISPAROS")))
      },
      {
        id: "pillar-noche-pico",
        label: "Franja Nocturna 18-24 hs (Pico 911)",
        category: "weapon",
        count: nightCount || 3397,
        x: 450,
        y: 430,
        color: "#eab308",
        description: "Franja horaria con mayor intensidad de abordajes delictivos y traslados de rodados a zonas de enfriamiento.",
        degree: 0,
        dominantSubstance: "Horario Nocturno",
        incidents: incidents.filter((i) => (i.franja || i.Franja_Horaria || "").includes("Noche"))
      },
      {
        id: "pillar-desguace-heras",
        label: "Hub Desguace Las Heras / Autódromo",
        category: "bunker",
        count: 156,
        x: 650,
        y: 430,
        color: "#8b5cf6",
        description: "Zona de amortiguamiento y despiece de chasis y autopartes de rodados sustraídos en el macrocentro.",
        degree: 0,
        isHub: true,
        dominantSubstance: "Desguace Ilegal",
        incidents: incidents.filter((i) => (i.direccion || i.Dirección || "").toLowerCase().includes("heras") || (i.relato || i.Relato || "").toLowerCase().includes("heras"))
      }
    ];

    // Combine candidate nodes
    const candidateNodes = [...pillarNodes, ...suspectNodes, ...bunkerNodes];
    const nodeLookup = new Map(candidateNodes.map((n) => [n.id, n]));

    // B. Build Edges (Co-occurrences)
    const edgeMap: Record<string, GraphEdge> = {};

    incidents.forEach((inc) => {
      const rel = (inc.relato || inc.Relato || "").toLowerCase();
      const addr = (inc.direccion || inc.Dirección || inc.calle || "").trim();
      const pat = (inc.patente || inc.Patente_Principal || "").trim().toUpperCase();
      const mar = (inc.marca || inc.Marca_Detectada || "").toUpperCase();
      const isArmed = Boolean(
        inc.tieneArmas ||
        (inc.origen || inc.Origen_Dataset || "").includes("DISPAROS") ||
        (inc.origen || inc.Origen_Dataset || "").includes("ARMA") ||
        rel.includes("arma") ||
        rel.includes("pistola") ||
        rel.includes("disparo") ||
        rel.includes("9mm")
      );
      const isNight = (inc.franja || inc.Franja_Horaria || "").includes("Noche");

      const matchedSuspectNodes = candidateNodes.filter((n) => {
        if (n.category !== "suspect") return false;
        if (pat && n.label.includes(pat)) return true;
        const cell = TACTICAL_CELLS.find((c) => c.name === n.label);
        if (cell) return cell.keywords.some((kw) => rel.includes(kw));
        return false;
      });

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
              label: "Operación en Intersección",
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
              label: "Co-operación Delictiva 911",
              type: "suspect-suspect"
            };
          }
          edgeMap[pairKey].weight += 1;
        }
      }

      // 3. Suspect / Bunker <-> Brand Pillars
      const relevantPillars: string[] = [];
      if (mar.includes("HONDA") || rel.includes("wave") || rel.includes("110")) relevantPillars.push("pillar-honda-wave");
      if (mar.includes("FIAT") || mar.includes("PEUGEOT") || rel.includes("cronos") || rel.includes("gol") || rel.includes("corsa")) relevantPillars.push("pillar-fiat-cronos");
      if (rel.includes("tornado") || rel.includes("rouser") || rel.includes("250")) relevantPillars.push("pillar-tornado-250");
      if (rel.includes("hilux") || rel.includes("ranger") || rel.includes("amarok") || rel.includes("pickup")) relevantPillars.push("pillar-pickups-hilux");

      relevantPillars.forEach((pillId) => {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__${pillId}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: pillId,
              weight: 0,
              label: "Objetivo Vehicular",
              type: "suspect-substance"
            };
          }
          edgeMap[edgeId].weight += 1;
        });

        if (matchedBunkerNode) {
          const edgeId = `${matchedBunkerNode.id}__${pillId}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: matchedBunkerNode.id,
              target: pillId,
              weight: 0,
              label: "Foco de Sustracción",
              type: "bunker-substance"
            };
          }
          edgeMap[edgeId].weight += 1;
        }
      });

      // 4. Suspect / Bunker <-> Weapon / Night Pillars
      if (isArmed) {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__pillar-arma-9mm`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: "pillar-arma-9mm",
              weight: 0,
              label: "Abordaje Armado",
              type: "suspect-weapon"
            };
          }
          edgeMap[edgeId].weight += 1;
        });

        if (matchedBunkerNode) {
          const edgeId = `${matchedBunkerNode.id}__pillar-arma-9mm`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: matchedBunkerNode.id,
              target: "pillar-arma-9mm",
              weight: 0,
              label: "Disparos / Conflicto",
              type: "bunker-weapon"
            };
          }
          edgeMap[edgeId].weight += 1;
        }
      }

      if (isNight) {
        matchedSuspectNodes.forEach((sn) => {
          const edgeId = `${sn.id}__pillar-noche-pico`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: sn.id,
              target: "pillar-noche-pico",
              weight: 0,
              label: "Accionar Nocturno",
              type: "suspect-weapon"
            };
          }
          edgeMap[edgeId].weight += 1;
        });
      }
    });

    // 5. Recoveries Edges: Vector Sustracción ➔ Recupero
    if (recoveries && recoveries.length > 0) {
      recoveries.forEach((rec) => {
        const rob = (rec.Dirección_Robo || "").trim();
        const hall = (rec.Dirección_Hallazgo || "").trim();
        const src = candidateNodes.find((n) => n.label.toLowerCase() === rob.toLowerCase());
        const tgt = candidateNodes.find((n) => n.label.toLowerCase() === hall.toLowerCase());

        if (src && tgt && src.id !== tgt.id) {
          const edgeId = `${src.id}__${tgt.id}`;
          if (!edgeMap[edgeId]) {
            edgeMap[edgeId] = {
              id: edgeId,
              source: src.id,
              target: tgt.id,
              weight: 0,
              label: "Vector Robo ➔ Descarte",
              type: "theft-recovery"
            };
          }
          edgeMap[edgeId].weight += 1;
        }
      });
    }

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
      "ciclomotor-110": { angle: (210 * Math.PI) / 180, radius: 280 },
      "tornado-alta": { angle: (270 * Math.PI) / 180, radius: 300 },
      "levantadores-autos": { angle: (330 * Math.PI) / 180, radius: 290 },
      "llave-corrida": { angle: (30 * Math.PI) / 180, radius: 270 },
      "disparos-batan": { angle: (90 * Math.PI) / 180, radius: 280 },
      "desguace-las-heras": { angle: (150 * Math.PI) / 180, radius: 290 },
      "deliverys-bicis": { angle: (180 * Math.PI) / 180, radius: 320 },
      "general": { angle: 0, radius: 340 }
    };

    const clusterCounters: Record<string, number> = {};

    candidateNodes.forEach((node) => {
      // If pillar node, maintain centered coordinates
      if (node.id.startsWith("pillar-")) {
        return;
      }

      const c = node.cliqueId || "general";
      const config = clusterAngles[c] || clusterAngles.general;
      const idx = clusterCounters[c] || 0;
      clusterCounters[c] = idx + 1;

      // Spiral scatter around cluster center
      const clusterCenterX = 550 + Math.cos(config.angle) * config.radius;
      const clusterCenterY = 380 + Math.sin(config.angle) * config.radius;

      const subAngle = idx * 0.9 + config.angle;
      const subRadius = 40 + ((idx * 16) % 110);

      node.x = Math.round(clusterCenterX + Math.cos(subAngle) * subRadius);
      node.y = Math.round(clusterCenterY + Math.sin(subAngle) * subRadius);

      // Clamp within SVG boundaries
      node.x = Math.max(70, Math.min(1030, node.x));
      node.y = Math.max(60, Math.min(700, node.y));
    });

    return { allNodes: candidateNodes, allEdges: edgesList };
  }, [incidents, recoveries, detectClique]);

  // -------------------------------------------------------------
  // 2. FILTERING & ACTIVE NODES COMPUTATION
  // -------------------------------------------------------------
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let nodes = allNodes;

    // Filter by Clique
    if (selectedClique !== "all") {
      nodes = nodes.filter(
        (n) => n.cliqueId === selectedClique || n.id.startsWith("pillar-")
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
      Despachos_911: n.count,
      Grado_Conexiones: n.degree,
      Marca_Tipologia: n.dominantSubstance || "N/D",
      Involucra_Armas: n.isArmed ? "SI" : "NO",
      Foco_Banda: n.cliqueId || "general",
      Direccion: n.address || n.barrio || ""
    }));
    exportToCSV(`grafo_criminal_mdp_${selectedClique}`, nodeExport);
  };

  const handleExportPDF = () => {
    const activeCliqueLabel = CLIQUE_PRESETS.find((c) => c.id === selectedClique)?.label || "Red General";
    const sampleCalls = activeSelectedNode ? activeSelectedNode.incidents : displayNodes.flatMap((n) => n.incidents).slice(0, 30);

    generateMdpGraphPDF({
      cliqueName: activeCliqueLabel,
      partido: "General Pueyrredón / Mar del Plata",
      nodes: displayNodes.map((n) => ({
        id: n.id,
        label: n.label,
        category:
          n.category === "suspect"
            ? "Célula / Rodado Bisagra"
            : n.category === "bunker"
            ? "Hub de Descarte / Intersección"
            : n.category === "weapon"
            ? "Armamento / Disparos"
            : "Blanco Vehicular",
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
        ? "Célula / Rodado Bisagra"
        : activeSelectedNode.category === "bunker"
        ? "Hub de Descarte / Intersección"
        : activeSelectedNode.category === "substance"
        ? "Blanco Vehicular"
        : "Armamento & Balística";
    const text = `FICHA INTELIGENCIA MSEG · MAR DEL PLATA\nEntidad: ${activeSelectedNode.label}\nCategoría: ${catLabel}\nDespachos 911: ${activeSelectedNode.count}\nConexiones: ${activeSelectedNode.degree}\nTipología/Marca: ${activeSelectedNode.dominantSubstance || 'N/D'}\nConflicto Armado: ${activeSelectedNode.isArmed ? 'SI' : 'NO'}\nUbicación: ${activeSelectedNode.address || activeSelectedNode.barrio || 'General Pueyrredón'}`;
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
          borderLeft: "4px solid var(--accent-pba-blue)",
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
                background: "rgba(13, 92, 168, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-pba-blue)",
                border: "1px solid rgba(13, 92, 168, 0.25)"
              }}
            >
              <Share2 size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 600, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
                  Grafo Relacional & Topología de Redes Criminales
                </h2>
                <span style={{ fontSize: "11px", background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.25)", padding: "2px 8px", borderRadius: "var(--radius-xs)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  EJE FORENSE · MAR DEL PLATA
                </span>
              </div>
              <p style={{ margin: "0.25rem 0 0", fontSize: "13.5px", color: "var(--text-muted)" }}>
                Modelado relacional de co-ocurrencia: Células Operativas &harr; Rodados/Patentes Bisagra &harr; Hubs de Descarte/Desguace &harr; Armamento &harr; Blancos Vehiculares (10.000+ llamados 911).
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
              Expediente Pericial (PDF)
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
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Vínculos Activos (911)</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.2rem" }}>
            {metrics.totalEdges} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>de {allEdges.length}</span>
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Células & Rodados</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#a78bfa", marginTop: "0.2rem" }}>
            {metrics.suspectsCount}
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Hubs & Intersecciones</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fbbf24", marginTop: "0.2rem" }}>
            {metrics.bunkersCount}
          </div>
        </div>

        <div className="card" style={{ padding: "0.9rem 1.1rem", borderLeft: "4px solid #ef4444" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Conflictividad Armada</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f87171", marginTop: "0.2rem" }}>
            {metrics.armedRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* ─── FILTER CONTROLS BAR ─── */}
      <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {/* Row 1: Clique Presets Chips */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Layers size={13} />
            <span>Selección de Foco Delictivo / Célula Específica (General Pueyrredón):</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {CLIQUE_PRESETS.map((clique) => {
              const isActive = selectedClique === clique.id;
              return (
                <button
                  key={clique.id}
                  onClick={() => setSelectedClique(clique.id)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.76rem",
                    fontWeight: isActive ? 800 : 600,
                    borderRadius: "6px",
                    border: isActive ? `1.5px solid ${clique.color}` : "1px solid var(--border)",
                    background: isActive ? `${clique.color}22` : "var(--bg-elevated)",
                    color: isActive ? clique.color : "var(--text-secondary)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{clique.icon}</span>
                  <span>{clique.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Category Filter Pills, Degree Slider, Search Bar & Zoom Tools */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid var(--border)" }}>
          {/* Category Pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)" }}>Categoría:</span>
            {[
              { id: "all", label: "Todos" },
              { id: "suspect", label: "Células/Rodados" },
              { id: "bunker", label: "Hubs/Descartes" },
              { id: "substance", label: "Marcas/Blancos" },
              { id: "weapon", label: "Armas/Horarios" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: "0.25rem 0.65rem",
                  fontSize: "0.74rem",
                  borderRadius: "4px",
                  fontWeight: filterCategory === cat.id ? 800 : 500,
                  background: filterCategory === cat.id ? "var(--accent-indigo)" : "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: filterCategory === cat.id ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Min Connections Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)" }}>Conexiones mínimas:</span>
            <input
              type="range"
              min={1}
              max={10}
              value={minConnections}
              onChange={(e) => setMinConnections(Number(e.target.value))}
              style={{ width: "80px", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--accent-indigo)", minWidth: "22px" }}>
              ≥ {minConnections}
            </span>
          </div>

          {/* Search Input */}
          <div style={{ position: "relative", minWidth: "200px" }}>
            <Search size={14} style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar patente, intersección, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.35rem 0.6rem 0.35rem 1.9rem",
                fontSize: "0.76rem",
                borderRadius: "5px",
                border: "1px solid var(--border)",
                background: "var(--bg-base)",
                color: "var(--text-primary)"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{ position: "absolute", right: "7px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Zoom Tools */}
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
      <div style={{ display: "grid", gridTemplateColumns: activeSelectedNode ? "1fr 410px" : "1fr", gap: "1.25rem", minHeight: "680px" }}>
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
              <pattern id="grid-dots-mdp" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="1" fill="#334155" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dots-mdp)" />

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
                } else if (edge.type === "theft-recovery") {
                  strokeColor = "#10b981";
                  strokeOpacity = 0.85;
                } else if (edge.type === "suspect-weapon" || edge.type === "bunker-weapon") {
                  strokeColor = "#f87171";
                  strokeOpacity = 0.6;
                } else if (edge.type === "suspect-substance" || edge.type === "bunker-substance") {
                  strokeColor = "#38bdf8";
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
                      strokeDasharray={edge.type === "theft-recovery" ? "6 4" : "none"}
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

              {/* NODES (ACTORES, HUBS & BLANCOS) */}
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
                      {node.category === "suspect"
                        ? "👤"
                        : node.category === "bunker"
                        ? "🏠"
                        : node.category === "substance"
                        ? "🚗"
                        : "⚡"}
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
                  {activeSelectedNode.category === "suspect"
                    ? "👤 CÉLULA / RODADO BISAGRA"
                    : activeSelectedNode.category === "bunker"
                    ? "🏠 HUB DE DESCARTE / CRUCE"
                    : activeSelectedNode.category === "substance"
                    ? "🚗 BLANCO VEHICULAR"
                    : "⚡ FACTOR BALÍSTICO / TIEMPO"}
                </span>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.4rem 0 0.1rem" }}>
                  {activeSelectedNode.label}
                </h3>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {activeSelectedNode.address || activeSelectedNode.barrio || "General Pueyrredón / Mar del Plata"}
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
                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Marca / Tipología</div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--accent-pba-blue)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {activeSelectedNode.dominantSubstance || "Honda / Fiat"}
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

              <button
                onClick={() => {
                  generateSNAWarrantPDF({
                    selectedNode: activeSelectedNode,
                    pivots: displayNodes.filter((n) => n.category === "suspect"),
                    stashes: displayNodes.filter((n) => n.category === "bunker"),
                    incidents: activeSelectedNode.incidents || [],
                  });
                }}
                style={{
                  flex: 1,
                  padding: "0.45rem",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  borderRadius: "5px",
                  background: "rgba(139, 92, 246, 0.1)",
                  border: "1px solid rgba(139, 92, 246, 0.35)",
                  color: "#7c3aed",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem"
                }}
                title="Emitir informe de fundamentación judicial para allanamiento / orden judicial basado en SNA"
              >
                <FileText size={14} />
                <span>Oficio SNA (PDF)</span>
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
                      borderLeft: `4px solid ${inc.tieneArmas || (inc.origen || inc.Origen_Dataset || "").includes("DISPAROS") ? '#dc2626' : '#0d5ca8'}`,
                      borderRadius: "4px",
                      padding: "0.6rem 0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                      <span><strong>#{inc.id || inc.ID}</strong> · {inc.fecha || inc.Fecha}</span>
                      <span style={{ color: inc.tieneArmas || (inc.origen || inc.Origen_Dataset || "").includes("DISPAROS") ? "#dc2626" : "#059669", fontWeight: 700 }}>
                        {inc.tieneArmas || (inc.origen || inc.Origen_Dataset || "").includes("DISPAROS") ? "⚠️ Con Armas" : "Sin Disparos"}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.75rem", color: "var(--text-primary)", marginBottom: "0.35rem" }}>
                      📍 <strong>{inc.direccion || inc.Dirección || "General Pueyrredón"}</strong>
                      {(inc.marca || inc.Marca_Detectada) && (
                        <span style={{ color: "var(--accent-pba-blue)", marginLeft: "0.4rem", fontWeight: 700 }}>
                          [{inc.marca || inc.Marca_Detectada}]
                        </span>
                      )}
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
