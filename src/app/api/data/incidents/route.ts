import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

let cachedIncidents: any[] | null = null;
let cachedRecoveries: any[] | null = null;

function loadDataServer() {
  if (!cachedIncidents) {
    let csvPath = path.join(process.cwd(), "public", "data", "processed", "mdp_incidentes_consolidado.csv");
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(process.cwd(), "data", "processed", "mdp_incidentes_consolidado.csv");
    }
    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      cachedIncidents = parsed.data.map((r: any) => ({
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
      cachedIncidents = [];
    }
  }

  if (!cachedRecoveries) {
    let recPath = path.join(process.cwd(), "public", "data", "processed", "mdp_vehiculos_recuperados.csv");
    if (!fs.existsSync(recPath)) {
      recPath = path.join(process.cwd(), "data", "processed", "mdp_vehiculos_recuperados.csv");
    }
    if (fs.existsSync(recPath)) {
      const fileContent = fs.readFileSync(recPath, "utf-8");
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      cachedRecoveries = parsed.data.map((r: any) => ({
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
      cachedRecoveries = [];
    }
  }

  return { incidents: cachedIncidents, recoveries: cachedRecoveries };
}

export async function GET(req: NextRequest) {
  const session = await checkAuthSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Acceso no autorizado" }, { status: 401 });
  }

  const { incidents, recoveries } = loadDataServer();
  const searchParams = req.nextUrl.searchParams;
  
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

  // Pre-aggregate statistics for dashboard efficiency
  const totalIncidents = filtered.length;
  const georeferencedCount = filtered.filter((r) => r.Latitud_Clean && r.Longitud_Clean).length;
  const georeferencedPct = totalIncidents > 0 ? (georeferencedCount / totalIncidents) * 100 : 0;
  const nightCount = filtered.filter((r) => r.Franja_Horaria.includes("Noche")).length;
  const nightPct = totalIncidents > 0 ? (nightCount / totalIncidents) * 100 : 0;

  return NextResponse.json({
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
