import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@/lib/auth";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

let cachedMdpIncidents: any[] | null = null;
let cachedMdpRecoveries: any[] | null = null;
let cachedJcpIncidents: any[] | null = null;
let cachedMalvinasIncidents: any[] | null = null;

function loadMalvinasData(): any[] {
  if (!cachedMalvinasIncidents) {
    let jsonPath = path.join(process.cwd(), "public", "data", "processed", "malvinas_drogas_consolidado.json");
    if (!fs.existsSync(jsonPath)) {
      jsonPath = path.join(process.cwd(), "data", "processed", "malvinas_drogas_consolidado.json");
    }
    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, "utf-8");
      cachedMalvinasIncidents = JSON.parse(content);
    } else {
      cachedMalvinasIncidents = [];
    }
  }
  return cachedMalvinasIncidents || [];
}


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

    const origen = searchParams.get("origen");
    const sustancia = searchParams.get("sustancia") || searchParams.get("subtipo");
    const tipoLugar = searchParams.get("tipoLugar");
    const tieneArmas = searchParams.get("tieneArmas");
    const barrio = searchParams.get("barrio");
    const franjaHoraria = searchParams.get("franjaHoraria");
    const diaSemana = searchParams.get("diaSemana");
    const qSearch = searchParams.get("q");

    if (origen && origen !== "todos") {
      const q = origen.toUpperCase();
      filtered = filtered.filter((r: any) => {
        const o = (r.origen || r.Origen_Dataset || "").toUpperCase();
        if (q === "DROGAS_ILICITAS_FORMAL") return o.includes("DROGAS_ILICITAS") || o.includes("FORMAL");
        if (q === "INFORMACION_VECINAL_KEYWORDS" || q === "INTELIGENCIA_RELATO_KEYWORDS") {
          return o.includes("KEYWORD") || o.includes("INFORMACION") || o.includes("RELATO");
        }
        return o.includes(q);
      });
    }
    if (sustancia && sustancia !== "todos") {
      const q = sustancia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => {
        const s = (r.sustancia || r.SubTipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (q.includes("coca")) return s.includes("coca");
        if (q.includes("paco")) return s.includes("paco") || s.includes("pasta base");
        if (q.includes("mari")) return s.includes("mari") || s.includes("faso") || s.includes("flores");
        if (q.includes("sintet")) return s.includes("sintet") || s.includes("pastilla") || s.includes("extasis");
        if (q.includes("poli")) return s.includes("poli") || s.includes("no especificada");
        return s.includes(q);
      });
    }
    if (tipoLugar && tipoLugar !== "todos") {
      const q = tipoLugar.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => {
        const lug = (r.tipoLugar || r.Tipo_Punto_Venta || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (q === "bunker") return lug.includes("bunker") || lug.includes("casilla") || lug.includes("baldio");
        if (q === "pasillo") return lug.includes("pasillo");
        if (q === "ventanita") return lug.includes("ventanita") || lug.includes("kiosco") || lug.includes("quiosco");
        if (q === "vivienda" || q.includes("domicilio")) return lug.includes("finca") || lug.includes("vivienda") || lug.includes("casa") || lug.includes("domicilio") || lug.includes("propiedad");
        if (q === "via_publica" || q.includes("publica") || q.includes("esquina")) return lug.includes("via publica") || lug.includes("esquina") || lug.includes("vereda");
        if (q === "no_especificado") return lug.includes("no especificado") || lug.includes("indefinido");
        return lug.includes(q);
      });
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
      const q = franjaHoraria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => (r.franja || r.Franja_Horaria || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q));
    }
    if (diaSemana && diaSemana !== "todos") {
      const q = diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => (r.dia || r.Dia_Semana || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q));
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

    const cocainaCount = filtered.filter((r: any) => {
      const s = (r.sustancia || "").toUpperCase();
      return s.includes("COCAINA") || s.includes("COCAÍNA");
    }).length;
    const marihuanaCount = filtered.filter((r: any) => (r.sustancia || "").toUpperCase().includes("MARIHUANA")).length;
    const pacoCount = filtered.filter((r: any) => (r.sustancia || "").toUpperCase().includes("PACO")).length;

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
  // PROYECTO 3: MALVINAS ARGENTINAS (DROGAS)
  // ==========================================
  if (project === "malvinas") {
    const rawMalvinas = loadMalvinasData();
    let filtered: any[] = rawMalvinas || [];

    const origen = searchParams.get("origen");
    const sustancia = searchParams.get("sustancia") || searchParams.get("subtipo");
    const tipoLugar = searchParams.get("tipoLugar");
    const tieneArmas = searchParams.get("tieneArmas");
    const barrio = searchParams.get("barrio");
    const franjaHoraria = searchParams.get("franjaHoraria");
    const diaSemana = searchParams.get("diaSemana");
    const qSearch = searchParams.get("q");

    if (origen && origen !== "todos") {
      const q = origen.toUpperCase();
      filtered = filtered.filter((r: any) => {
        const o = (r.origen || r.Origen_Dataset || "").toUpperCase();
        if (q === "DROGAS_ILICITAS_FORMAL") return o.includes("DROGAS_ILICITAS") || o.includes("FORMAL");
        if (q === "INFORMACION_VECINAL_KEYWORDS") return o.includes("KEYWORD") || o.includes("INFORMACION");
        return o.includes(q);
      });
    }
    if (sustancia && sustancia !== "todos") {
      const q = sustancia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => {
        const s = (r.sustancia || r.SubTipo || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (q.includes("coca")) return s.includes("coca");
        if (q.includes("paco")) return s.includes("paco") || s.includes("pasta base");
        if (q.includes("mari")) return s.includes("mari") || s.includes("faso") || s.includes("flores");
        if (q.includes("sintet")) return s.includes("sintet") || s.includes("pastilla") || s.includes("extasis");
        if (q.includes("poli")) return s.includes("poli") || s.includes("no especificada");
        return s.includes(q);
      });
    }
    if (tipoLugar && tipoLugar !== "todos") {
      const q = tipoLugar.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => {
        const lug = (r.tipoLugar || r.Tipo_Punto_Venta || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (q === "bunker") return lug.includes("bunker") || lug.includes("casilla") || lug.includes("baldio");
        if (q === "pasillo") return lug.includes("pasillo");
        if (q === "ventanita") return lug.includes("ventanita") || lug.includes("kiosco") || lug.includes("quiosco");
        if (q === "vivienda" || q.includes("domicilio")) return lug.includes("finca") || lug.includes("vivienda") || lug.includes("casa") || lug.includes("domicilio") || lug.includes("propiedad");
        if (q === "via_publica" || q.includes("publica") || q.includes("esquina")) return lug.includes("via publica") || lug.includes("esquina") || lug.includes("vereda");
        if (q === "no_especificado") return lug.includes("no especificado") || lug.includes("indefinido");
        return lug.includes(q);
      });
    }
    if (tieneArmas && tieneArmas !== "todos") { const w = tieneArmas === "true"; filtered = filtered.filter((r: any) => r.tieneArmas === w); }
    if (barrio && barrio !== "todos") filtered = filtered.filter((r: any) => (r.barrio || "").toUpperCase().includes(barrio.toUpperCase()));
    if (franjaHoraria && franjaHoraria !== "todos") {
      const q = franjaHoraria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => (r.franja || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q));
    }
    if (diaSemana && diaSemana !== "todos") {
      const q = diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((r: any) => (r.dia || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q));
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
    const cocainaCount = filtered.filter((r: any) => {
      const s = (r.sustancia || "").toUpperCase();
      return s.includes("COCAINA") || s.includes("COCAÍNA");
    }).length;
    const marihuanaCount = filtered.filter((r: any) => (r.sustancia || "").toUpperCase().includes("MARIHUANA")).length;
    const pacoCount = filtered.filter((r: any) => (r.sustancia || "").toUpperCase().includes("PACO")).length;

    return NextResponse.json({
      project: "malvinas",
      totalIncidents, georeferencedCount, georeferencedPct,
      armasCount, armasPct, nightCount, nightPct,
      cocainaCount, marihuanaCount, pacoCount,
      incidentsCount: filtered.length,
      incidents: filtered, incidentsSample: filtered,
      geoPoints: filtered.filter((r: any) => r.lat && r.lng).map((r: any) => ({
        id: r.id, lat: r.lat, lng: r.lng, tipo: r.tipo, subtipo: r.subtipo,
        sustancia: r.sustancia, direccion: r.direccion, fecha: r.fecha,
        franja: r.franja, dia: r.dia, hora: r.hora, tieneArmas: r.tieneArmas,
        tipoLugar: r.tipoLugar, alias: r.alias, barrio: r.barrio,
        relato: r.relato, comentario: r.comentario, localidad: r.localidad,
        partido: r.partido
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

  const normalizeStr = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (tipo && tipo !== "todos") {
    const qNorm = normalizeStr(tipo);
    filtered = filtered.filter((r) => {
      const tNorm = normalizeStr(r.Tipo || "");
      const oNorm = normalizeStr(r.Origen_Dataset || "");
      return tNorm.includes(qNorm) || oNorm.includes(qNorm);
    });
  }
  if (subtipo && subtipo !== "todos") {
    const qNorm = normalizeStr(subtipo);
    filtered = filtered.filter((r) => {
      const sNorm = normalizeStr(r.SubTipo || "");
      // Compatibility between VEHÍCULOS and VEHICULAR / AUTOMOTOR
      if (qNorm.includes("vehicul") || qNorm.includes("auto")) {
        return sNorm.includes("vehicul") || sNorm.includes("auto");
      }
      if (qNorm.includes("moto") || qNorm.includes("ciclomotor")) {
        return sNorm.includes("moto") || sNorm.includes("ciclomotor");
      }
      return sNorm.includes(qNorm);
    });
  }
  if (franjaHoraria && franjaHoraria !== "todos") {
    const q = normalizeStr(franjaHoraria);
    filtered = filtered.filter((r) => normalizeStr(r.Franja_Horaria || "").includes(q));
  }
  if (diaSemana && diaSemana !== "todos") {
    const q = normalizeStr(diaSemana);
    filtered = filtered.filter((r) => normalizeStr(r.Dia_Semana || "").includes(q));
  }
  if (origenDataset && origenDataset !== "todos") {
    const q = normalizeStr(origenDataset);
    filtered = filtered.filter((r) => normalizeStr(r.Origen_Dataset || "").includes(q));
  }

  // Robust helper for recoveries vehicle classification (Honda Fit is Auto, Honda Wave is Moto)
  const checkIsRecoveryMoto = (r: any): boolean => {
    const sub = (r.SubTipo || "").toUpperCase();
    const mar = (r.Marca_Detectada || "").toUpperCase();
    const mod = (r.Modelo_Detectado || "").toUpperCase();
    const rel = `${r.Relato_Robo || ""} ${r.Relato_Hallazgo || ""}`.toUpperCase();

    if (sub.includes("MOTO") || sub.includes("CICLOMOTOR")) return true;
    if (sub.includes("AUTO") || sub.includes("VEHICUL") || sub.includes("CAMIONETA")) {
      if (!["ZANELLA", "MOTOMEL", "CORVEN", "GILERA", "BAJAJ", "KTM"].some((m) => mar.includes(m))) {
        return false;
      }
    }
    if (mar.includes("HONDA")) {
      if (["FIT", "CIVIC", "CITY", "CRV", "CR-V", "HRV", "HR-V", "ACCORD", "AUTO", "VEHICULO"].some((x) => mod.includes(x) || rel.includes(x))) {
        return false;
      }
      if (["WAVE", "TORNADO", "XR", "TITAN", "TWISTER", "CG", "CB", "BIZ", "MOTO"].some((x) => mod.includes(x) || rel.includes(x))) {
        return true;
      }
    }
    return ["ZANELLA", "YAMAHA", "MOTOMEL", "GILERA", "CORVEN", "KTM", "BAJAJ", "SIAM", "GUERRERO", "MONDIAL", "BRAVA"].some((m) => mar.includes(m));
  };

  // Filter recoveries based on subtipo (Autos vs Motos) if specified
  let filteredRecoveries = recoveries;
  if (subtipo && subtipo !== "todos") {
    const qNorm = normalizeStr(subtipo);
    if (qNorm.includes("moto") || qNorm.includes("ciclomotor")) {
      filteredRecoveries = filteredRecoveries.filter(checkIsRecoveryMoto);
    } else if (qNorm.includes("vehicul") || qNorm.includes("auto")) {
      filteredRecoveries = filteredRecoveries.filter((r) => !checkIsRecoveryMoto(r));
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
