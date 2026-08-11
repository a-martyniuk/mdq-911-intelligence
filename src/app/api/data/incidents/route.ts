import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

let cachedIncidents: any[] | null = null;
let cachedRecoveries: any[] | null = null;

function loadDataServer() {
  if (!cachedIncidents) {
    const csvPath = path.join(process.cwd(), "data", "processed", "mdp_incidentes_consolidado.csv");
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
    const recPath = path.join(process.cwd(), "data", "processed", "mdp_vehiculos_recuperados.csv");
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
    filtered = filtered.filter((r) => r.Tipo === tipo);
  }
  if (subtipo && subtipo !== "todos") {
    filtered = filtered.filter((r) => r.SubTipo === subtipo);
  }
  if (franjaHoraria && franjaHoraria !== "todos") {
    filtered = filtered.filter((r) => r.Franja_Horaria === franjaHoraria);
  }
  if (diaSemana && diaSemana !== "todos") {
    filtered = filtered.filter((r) => r.Dia_Semana === diaSemana);
  }
  if (origenDataset && origenDataset !== "todos") {
    filtered = filtered.filter((r) => r.Origen_Dataset === origenDataset);
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
    incidentsSample: filtered.slice(0, 1000), // Max 1000 sample for map rendering performance
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
    recoveries,
  });
}
