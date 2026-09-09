import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

let cachedMdpIncidents: any[] | null = null;
let cachedMdpRecoveries: any[] | null = null;
let cachedJcpIncidents: any[] | null = null;

function loadMdpData() {
  if (!cachedMdpIncidents) {
    let csvPath = path.join(process.cwd(), "public", "data", "processed", "mdp_incidentes_consolidado.csv");
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(process.cwd(), "data", "processed", "mdp_incidentes_consolidado.csv");
    }
    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      cachedMdpIncidents = parsed.data.map((r: any) => ({
        ID: parseInt(r.ID, 10) || 0,
        Fecha: r.Fecha || "",
        Año: parseInt(r.Año, 10) || 2026,
        Mes: parseInt(r.Mes, 10) || 1,
        Mes_Nombre: r.Mes_Nombre || "",
        Dia: parseInt(r.Dia, 10) || 1,
        Hora: parseInt(r.Hora, 10) || 0,
        Dia_Semana: r.Dia_Semana || "",
        Es_FinDeSemana: r.Es_FinDeSemana === "True" || r.Es_FinDeSemana === "true",
        Franja_Horaria: r.Franja_Horaria || "",
        Tipo: r.Tipo || "",
        SubTipo: r.SubTipo || "",
        Dirección: r.Dirección || "",
        Latitud_Clean: parseFloat(r.Latitud_Clean) || undefined,
        Longitud_Clean: parseFloat(r.Longitud_Clean) || undefined,
        Patente_Principal: r.Patente_Principal !== "nan" ? r.Patente_Principal : undefined,
        Marca_Detectada: r.Marca_Detectada || "NO ESPECIFICADO",
        Origen_Dataset: r.Origen_Dataset || "",
        Relato: r.Relato || ""
      }));
    } else {
      cachedMdpIncidents = [];
    }
  }

  if (!cachedMdpRecoveries) {
    let recPath = path.join(process.cwd(), "public", "data", "processed", "mdp_vehiculos_recuperados.csv");
    if (!fs.existsSync(recPath)) {
      recPath = path.join(process.cwd(), "data", "processed", "mdp_vehiculos_recuperados.csv");
    }
    if (fs.existsSync(recPath)) {
      const fileContent = fs.readFileSync(recPath, "utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      cachedMdpRecoveries = parsed.data.map((r: any) => ({
        ID_Robo: parseInt(r.ID_Robo, 10) || 0,
        ID_Hallazgo: parseInt(r.ID_Hallazgo, 10) || 0,
        Fecha_Robo: r.Fecha_Robo || "",
        Fecha_Hallazgo: r.Fecha_Hallazgo || "",
        Patente_Principal: r.Patente_Principal || "",
        SubTipo: r.SubTipo || "",
        Dirección_Robo: r.Dirección_Robo || "",
        Dirección_Hallazgo: r.Dirección_Hallazgo || "",
        Latitud_Clean_Robo: parseFloat(r.Latitud_Clean_Robo) || undefined,
        Longitud_Clean_Robo: parseFloat(r.Longitud_Clean_Robo) || undefined,
        Latitud_Clean_Hallazgo: parseFloat(r.Latitud_Clean_Hallazgo) || undefined,
        Longitud_Clean_Hallazgo: parseFloat(r.Longitud_Clean_Hallazgo) || undefined,
        Marca_Detectada: r.Marca_Detectada || "",
        Horas_Hasta_Hallazgo: parseFloat(r.Horas_Hasta_Hallazgo) || 0,
        Dias_Hasta_Hallazgo: parseFloat(r.Dias_Hasta_Hallazgo) || 0,
        Relato_Robo: r.Relato_Robo || "",
        Relato_Hallazgo: r.Relato_Hallazgo || ""
      }));
    } else {
      cachedMdpRecoveries = [];
    }
  }

  return { incidents: cachedMdpIncidents, recoveries: cachedMdpRecoveries };
}

function loadJcpData(): any[] {
  if (!cachedJcpIncidents) {
    let jsonPath = path.join(process.cwd(), "public", "data", "processed", "jcp_drogas_consolidado.json");
    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(process.cwd(), "data", "processed", "jcp_drogas_consolidado.json");
    }
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, "utf-8");
      cachedJcpIncidents = JSON.parse(content);
    } else {
      cachedJcpIncidents = [];
    }
  }
  return cachedJcpIncidents || [];
}

export async function GET(req: NextRequest) {
  const session = await checkAuthSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const project = (searchParams.get("project") || "mdp").toLowerCase();

  // ==========================================
  // PROYECTO 2: JOSÉ C. PAZ (DROGAS / NARCO)
  // ==========================================
  if (project === "jcp" || project === "drogas") {
    const rawJcp = loadJcpData();
    let filtered: any[] = rawJcp || [];

    const sustancia = searchParams.get("sustancia") || searchParams.get("subtipo");
    const tipoLugar = searchParams.get("tipoLugar");
    const tieneArmas = searchParams.get("tieneArmas");
    const barrio = searchParams.get("barrio");
    const franjaHoraria = searchParams.get("franjaHoraria");
    const diaSemana = searchParams.get("diaSemana");
    const qSearch = searchParams.get("q");

    if (sustancia && sustancia !== "todos") {
      const q = sustancia.toUpperCase();
      filtered = filtered.filter((r: any) => (r.sustancia || r.SubTipo || "").toUpperCase().includes(q));
    }
    if (tipoLugar && tipoLugar !== "todos") {
      const q = tipoLugar.toUpperCase();
      filtered = filtered.filter((r: any) => (r.tipoLugar || r.Tipo_Punto_Venta || "").toUpperCase().includes(q));
    }
    if (tieneArmas && tieneArmas !== "todos") {
      const wantArmas = tieneArmas === "true" || tieneArmas === "1";
      filtered = filtered.filter((r: any) => r.tieneArmas === wantArmas);
    }
    if (barrio && barrio !== "todos") {
      const q = barrio.toUpperCase();
      filtered = filtered.filter((r: any) => (r.barrio || r.Barrio_Detectado || "").toUpperCase().includes(q));
    }
    if (franjaHoraria && franjaHoraria !== "todos") {
      const q = franjaHoraria.toUpperCase();
      filtered = filtered.filter((r: any) => (r.franja || r.Franja_Horaria || "").toUpperCase().includes(q));
    }
    if (diaSemana && diaSemana !== "todos") {
      const q = diaSemana.toUpperCase();
      filtered = filtered.filter((r: any) => (r.dia || r.Dia_Semana || "").toUpperCase().includes(q));
    }
    if (qSearch && qSearch.trim() !== "") {
      const q = qSearch.toLowerCase();
      filtered = filtered.filter((r: any) =>
        (r.relato || "").toLowerCase().includes(q) ||
        (r.direccion || "").toLowerCase().includes(q) ||
        (r.comentario || "").toLowerCase().includes(q) ||
        (r.alias || []).some((a: string) => a.toLowerCase().includes(q))
      );
    }

    const totalIncidents = filtered.length;
    const georeferencedCount = filtered.filter((r: any) => r.lat && r.lng).length;
    const georeferencedPct = totalIncidents > 0 ? (georeferencedCount / totalIncidents) * 100 : 0;
    const armasCount = filtered.filter((r: any) => r.tieneArmas).length;
    const armasPct = totalIncidents > 0 ? (armasCount / totalIncidents) * 100 : 0;
    const nightCount = filtered.filter((r: any) => (r.franja || "").includes("Noche")).length;
    const nightPct = totalIncidents > 0 ? (nightCount / totalIncidents) * 100 : 0;

    const cocainaCount = filtered.filter((r: any) => (r.sustancia || "").includes("COCAÍNA")).length;
    const marihuanaCount = filtered.filter((r: any) => (r.sustancia || "").includes("MARIHUANA")).length;
    const pacoCount = filtered.filter((r: any) => (r.sustancia || "").includes("PACO")).length;

    return NextResponse.json({
      project: "jcp",
      totalIncidents,
      georeferencedCount,
      georeferencedPct,
      armasCount,
      armasPct,
      nightCount,
      nightPct,
      cocainaCount,
      marihuanaCount,
      pacoCount,
      incidentsCount: filtered.length,
      incidents: filtered,
      incidentsSample: filtered,
      geoPoints: filtered.filter((r: any) => r.lat && r.lng).map((r: any) => ({
        id: r.id,
        lat: r.lat,
        lng: r.lng,
        tipo: r.tipo,
        subtipo: r.subtipo,
        sustancia: r.sustancia,
        direccion: r.direccion,
        fecha: r.fecha,
        franja: r.franja,
        dia: r.dia,
        hora: r.hora,
        tieneArmas: r.tieneArmas,
        tipoLugar: r.tipoLugar,
        alias: r.alias,
        barrio: r.barrio,
        relato: r.relato,
        comentario: r.comentario
      })),
      recoveries: []
    });
  }

  // ==========================================
  // PROYECTO 1: MAR DEL PLATA (AUTOMOTORES)
  // ==========================================
  const { incidents, recoveries } = loadMdpData();

  const tipo = searchParams.get("tipo");
  const subtipo = searchParams.get("subtipo");
  const franjaHoraria = searchParams.get("franjaHoraria");
  const diaSemana = searchParams.get("diaSemana");
  const origenDataset = searchParams.get("origenDataset");

  let filtered = incidents;

  if (tipo && tipo !== "todos") {
    const q = tipo.toUpperCase();
    filtered = filtered.filter((r) => (r.Tipo || "").toUpperCase().includes(q) || (r.Origen_Dataset || "").toUpperCase().includes(q));
  }
  if (subtipo && subtipo !== "todos") {
    const q = subtipo.toUpperCase();
    filtered = filtered.filter((r) => (r.SubTipo || "").toUpperCase().includes(q));
  }
  if (franjaHoraria && franjaHoraria !== "todos") {
    const q = franjaHoraria.toUpperCase();
    filtered = filtered.filter((r) => (r.Franja_Horaria || "").toUpperCase().includes(q));
  }
  if (diaSemana && diaSemana !== "todos") {
    const q = diaSemana.toUpperCase();
    filtered = filtered.filter((r) => (r.Dia_Semana || "").toUpperCase().includes(q));
  }
  if (origenDataset && origenDataset !== "todos") {
    const q = origenDataset.toUpperCase();
    filtered = filtered.filter((r) => (r.Origen_Dataset || "").toUpperCase().includes(q));
  }

  // Filter recoveries based on subtipo (Autos vs Motos) if specified
  let filteredRecoveries = recoveries;
  if (subtipo && subtipo !== "todos") {
    const subUpper = subtipo.toUpperCase();
    if (subUpper.includes("MOTO")) {
      filteredRecoveries = filteredRecoveries.filter((r) => {
        const sub = (r.SubTipo || "").toUpperCase();
        const mar = (r.Marca_Detectada || "").toUpperCase();
        return sub.includes("MOTO") || ["HONDA", "ZANELLA", "YAMAHA", "MOTOMEL", "GILERA", "CORVEN", "KTM", "BAJAJ"].some((m) => mar.includes(m));
      });
    } else if (subUpper.includes("VEHÍCUL") || subUpper.includes("AUTO")) {
      filteredRecoveries = filteredRecoveries.filter((r) => {
        const sub = (r.SubTipo || "").toUpperCase();
        const mar = (r.Marca_Detectada || "").toUpperCase();
        return !sub.includes("MOTO") && !["HONDA", "ZANELLA", "YAMAHA", "MOTOMEL", "GILERA", "CORVEN", "KTM", "BAJAJ"].some((m) => mar.includes(m));
      });
    }
  }

  const totalIncidents = filtered.length;
  const georeferencedCount = filtered.filter((r) => r.Latitud_Clean && r.Longitud_Clean).length;
  const georeferencedPct = totalIncidents > 0 ? (georeferencedCount / totalIncidents) * 100 : 0;
  const nightCount = filtered.filter((r) => (r.Franja_Horaria || "").includes("Noche")).length;
  const nightPct = totalIncidents > 0 ? (nightCount / totalIncidents) * 100 : 0;

  return NextResponse.json({
    project: "mdp",
    totalIncidents,
    georeferencedCount,
    georeferencedPct,
    nightCount,
    nightPct,
    incidentsCount: filtered.length,
    incidents: filtered,
    incidentsSample: filtered,
    geoPoints: filtered.filter((r) => r.Latitud_Clean && r.Longitud_Clean).map((r) => ({
      id: r.ID,
      lat: r.Latitud_Clean,
      lng: r.Longitud_Clean,
      tipo: r.Tipo,
      subtipo: r.SubTipo,
      direccion: r.Dirección,
      fecha: r.Fecha,
      origen: r.Origen_Dataset,
      franja: r.Franja_Horaria,
      dia: r.Dia_Semana,
      hora: r.Hora,
      marca: r.Marca_Detectada,
      patente: r.Patente_Principal,
      relato: r.Relato
    })),
    recoveries: filteredRecoveries,
  });
}
