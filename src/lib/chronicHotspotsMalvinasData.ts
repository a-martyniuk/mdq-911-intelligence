// Datos Analíticos y Geoespaciales de los 10 Nodos Crónicos de Resistencia Criminal
// Generado a partir de la clusterización espacial de 1.471 despachos 911 en Malvinas Argentinas

export interface ChronicHotspotNode {
  id: number;
  name: string;
  shortName: string;
  barrio: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  totalIncidents: number;
  armedIncidents: number;
  pctArmed: number;
  bunkersCount: number;
  comisaria: string;
  nivelRiesgo: "CRÍTICO" | "SEVERO" | "ALTO";
  callesClave: string[];
  sustanciasDominantes: string[];
  franjaCritica: string;
  modusOperandi: string;
  intervencionSugerida: string;
  renabapCercano?: string;
}

export type ChronicHotspot = ChronicHotspotNode;

export const CHRONIC_HOTSPOTS_MALVINAS: ChronicHotspotNode[] = [
  {
    id: 1,
    name: "Nodo #1: RICARDO ROJAS y Juan Bautista Ambrosetti",
    shortName: "Ricardo Rojas & Ambrosetti",
    barrio: "Grand Bourg Norte",
    lat: -34.493,
    lng: -58.742,
    radiusMeters: 380,
    totalIncidents: 71,
    armedIncidents: 40,
    pctArmed: 56.3,
    bunkersCount: 4,
    comisaria: "Comisaría 1ra (Grand Bourg)",
    nivelRiesgo: "CRÍTICO",
    callesClave: [
      "RICARDO ROJAS y Juan Bautista Ambrosetti",
      "RICARDO ROJAS al 100",
      "AMBROSETTI y Beiro"
    ],
    sustanciasDominantes: ["POLIRUBRO / NO ESPECIFICADA", "COCAÍNA"],
    franjaCritica: "Noche (18-24 hs)",
    modusOperandi: "Comercialización masiva en vía pública y casas tomadas en torno a la esquina de Ricardo Rojas. Alta presencia de jóvenes sentinelas a pie. Conducción de operaciones desde vivienda principal con múltiples bocas de expendio.",
    intervencionSugerida: "Plan de Saturación Perimetral con 4 móviles en rotación. Relevamiento catastral de inmuebles abandonados en radio de 380m. Solicitud judicial de escuchas telefónicas sobre números detectados en reiterados llamados.",
    renabapCercano: "Barrio Popular Santa Mónica"
  },
  {
    id: 2,
    name: "Nodo #2: COMBATE DE SAN LORENZO y Sarmiento",
    shortName: "San Lorenzo & Sarmiento",
    barrio: "Grand Bourg Centro",
    lat: -34.500,
    lng: -58.720,
    radiusMeters: 380,
    totalIncidents: 45,
    armedIncidents: 24,
    pctArmed: 53.3,
    bunkersCount: 3,
    comisaria: "Comisaría 2da (Los Polvorines)",
    nivelRiesgo: "CRÍTICO",
    callesClave: [
      "COMBATE DE SAN LORENZO al 300",
      "SARMIENTO y San Lorenzo",
      "RIVADAVIA y San Lorenzo"
    ],
    sustanciasDominantes: ["COCAÍNA", "MARIHUANA"],
    franjaCritica: "Noche (20-02 hs)",
    modusOperandi: "Zona limítrofe entre jurisdicciones policiales explotada para dificultar intervenciones continuas. Puntos de venta semi-fijos en esquinas y delivery en motos sin patente.",
    intervencionSugerida: "Coordinación inter-comisarial 1ra-2da para patrullajes cerrojo. Operativos de interceptación vehicular sorpresiva sobre motos sin patente.",
    renabapCercano: "Barrio Popular Santa Lucía"
  },
  {
    id: 3,
    name: "Nodo #3: JOSE HERNANDEZ y Maure",
    shortName: "Hernández & Maure",
    barrio: "Grand Bourg / Límite Villa de Mayo",
    lat: -34.499,
    lng: -58.739,
    radiusMeters: 380,
    totalIncidents: 37,
    armedIncidents: 26,
    pctArmed: 70.3,
    bunkersCount: 6,
    comisaria: "Comisaría 1ra (Grand Bourg)",
    nivelRiesgo: "CRÍTICO",
    callesClave: [
      "JOSE HERNANDEZ al 1100",
      "JOSE HERNANDEZ y Maure",
      "BOUCHARD y Jose Hernandez"
    ],
    sustanciasDominantes: ["COCAÍNA", "PACO"],
    franjaCritica: "Madrugada (00-06 hs)",
    modusOperandi: "Conglomerado de 6 bocas de expendio en radio de 2 cuadras. Foco crítico de paco y pasta base. Custodia con armas de fuego en las esquinas de acceso.",
    intervencionSugerida: "Operativo táctico nocturno con fuerzas especiales. Allanamientos simultáneos de las 6 bocas identificadas e intervención judicial por venta de paco.",
    renabapCercano: "Barrio Popular Eaton"
  },
  {
    id: 4,
    name: "Nodo #4: MARINO LUIS PY y Hiroshima",
    shortName: "Py & Hiroshima",
    barrio: "Ing. Pablo Nogués Noreste",
    lat: -34.480,
    lng: -58.715,
    radiusMeters: 380,
    totalIncidents: 29,
    armedIncidents: 27,
    pctArmed: 93.1,
    bunkersCount: 8,
    comisaria: "Comisaría 3ra (Pablo Nogués)",
    nivelRiesgo: "CRÍTICO",
    callesClave: [
      "MARINO LUIS PY y Hiroshima",
      "MARINO LUIS PY y Descartes",
      "HIROSHIMA y Morse"
    ],
    sustanciasDominantes: ["COCAÍNA", "POLIRUBRO"],
    franjaCritica: "Noche (19-01 hs)",
    modusOperandi: "Epicentro de mayor hostilidad armada del partido: 93% de hechos con armas reportadas. 8 búnkers y casillas fortificadas. Fuerte intimidación y tiroteos a testigos vecinales.",
    intervencionSugerida: "Intervención de máxima seguridad con Grupo GAD. Derribo de búnkers y puestos fortificados. Protección a testigos vecinales.",
    renabapCercano: "Barrio Popular Bellaflor"
  },
  {
    id: 5,
    name: "Nodo #5: TOKIO y Santa Sede",
    shortName: "Tokio & Santa Sede",
    barrio: "Ing. Pablo Nogués Oeste",
    lat: -34.480,
    lng: -58.709,
    radiusMeters: 380,
    totalIncidents: 23,
    armedIncidents: 20,
    pctArmed: 87.0,
    bunkersCount: 5,
    comisaria: "Comisaría 3ra (Pablo Nogués)",
    nivelRiesgo: "SEVERO",
    callesClave: [
      "TOKIO y Santa Sede",
      "PJE SANTA SEDE y Tokio",
      "TOKIO al 1000"
    ],
    sustanciasDominantes: ["COCAÍNA", "MARIHUANA"],
    franjaCritica: "Tarde / Noche (16-22 hs)",
    modusOperandi: "Red satelital vinculada al nodo Py & Hiroshima. Escape inmediato hacia arterias de egreso. Empleo de menores de edad como campanas y pasadores.",
    intervencionSugerida: "Saturación perimetral coordinada con el Nodo #4. Corte de ejes de escape y control dinámico con patrullas motorizadas.",
    renabapCercano: "Barrio Popular El Chiri"
  },
  {
    id: 6,
    name: "Nodo #6: ALFREDO L PALACIOS y Cangallo",
    shortName: "Palacios & Cangallo",
    barrio: "Los Polvorines Sur",
    lat: -34.503,
    lng: -58.729,
    radiusMeters: 380,
    totalIncidents: 22,
    armedIncidents: 19,
    pctArmed: 86.4,
    bunkersCount: 1,
    comisaria: "Comisaría 2da (Los Polvorines)",
    nivelRiesgo: "SEVERO",
    callesClave: [
      "ALFREDO L PALACIOS y Cangallo",
      "CANGALLO y Palacios",
      "LAPRIDA y Palacios"
    ],
    sustanciasDominantes: ["COCAÍNA"],
    franjaCritica: "Noche (18-02 hs)",
    modusOperandi: "Expendio en vía pública con un búnker de resguardo cercano. Alta tasa de portación de armas de fuego y enfrentamientos entre soldaditos de guardia.",
    intervencionSugerida: "Patrullajes a pie intensivos y desarticulación del búnker de apoyo. Puntos de control fijos en esquinas de acceso a Cangallo.",
    renabapCercano: "Barrio Popular San Carlitos"
  },
  {
    id: 7,
    name: "Nodo #7: HIPOLITO BOUCHARD y Almte Brown",
    shortName: "Bouchard & Brown",
    barrio: "Grand Bourg Sur",
    lat: -34.496,
    lng: -58.738,
    radiusMeters: 380,
    totalIncidents: 19,
    armedIncidents: 16,
    pctArmed: 84.2,
    bunkersCount: 3,
    comisaria: "Comisaría 1ra (Grand Bourg)",
    nivelRiesgo: "SEVERO",
    callesClave: [
      "HIPOLITO BOUCHARD y Almte Brown",
      "ALMIRANTE BROWN y Bouchard",
      "JOSE HERNANDEZ y Bouchard"
    ],
    sustanciasDominantes: ["COCAÍNA", "MARIHUANA"],
    franjaCritica: "Tarde (14-20 hs)",
    modusOperandi: "Puntos de venta de cocaína fraccionada en viviendas particulares con ventanitas de chapa. Distribución hacia barrios periféricos.",
    intervencionSugerida: "Inspecciones judiciales de los domicilios reincidentes. Investigación de la cadena de proveedores que abastece este corredor.",
    renabapCercano: "Barrio Popular Santa Mónica"
  },
  {
    id: 8,
    name: "Nodo #8: POZO DE VARGAS al 2700",
    shortName: "Pozo de Vargas",
    barrio: "Ing. Pablo Nogués Centro",
    lat: -34.482,
    lng: -58.709,
    radiusMeters: 380,
    totalIncidents: 19,
    armedIncidents: 16,
    pctArmed: 84.2,
    bunkersCount: 2,
    comisaria: "Comisaría 3ra (Pablo Nogués)",
    nivelRiesgo: "SEVERO",
    callesClave: [
      "POZO DE VARGAS al 2700",
      "POZO DE VARGAS y Tokio",
      "POZO DE VARGAS y Descartes"
    ],
    sustanciasDominantes: ["COCAÍNA"],
    franjaCritica: "Noche (20-03 hs)",
    modusOperandi: "Expendio en pasillo interior de difícil penetración vehicular. Centinelas con silbatos y armas cortas alertan ante proximidad policial.",
    intervencionSugerida: "Incursión táctica a pie con unidades de apoyo rápido. Corte de los dos extremos del pasillo de Pozo de Vargas durante el procedimiento.",
    renabapCercano: "Barrio Popular Bellaflor"
  },
  {
    id: 9,
    name: "Nodo #9: YATASTO y Panamá",
    shortName: "Yatasto & Panamá",
    barrio: "Tortuguitas Centro",
    lat: -34.465,
    lng: -58.738,
    radiusMeters: 380,
    totalIncidents: 17,
    armedIncidents: 11,
    pctArmed: 64.7,
    bunkersCount: 6,
    comisaria: "Comisaría 4ta (Tortuguitas)",
    nivelRiesgo: "ALTO",
    callesClave: [
      "PANAMA y Yatasto",
      "YATASTO y Panama",
      "PANAMA al 1200"
    ],
    sustanciasDominantes: ["POLIRUBRO / NO ESPECIFICADA", "COCAÍNA"],
    franjaCritica: "Tarde / Noche (15-22 hs)",
    modusOperandi: "El nodo con mayor densidad de búnkers en Tortuguitas (6 bocas). Venta continua con rotación de vendedores para evitar flagrancia.",
    intervencionSugerida: "Operativo multi-objetivo con allanamientos en simultáneo. Blindaje de la salida hacia Ruta 197.",
    renabapCercano: "Barrio Popular El Cuadrado"
  },
  {
    id: 10,
    name: "Nodo #10: SOLDADOS EXCOMBATIENTES y Uruguay",
    shortName: "Excombatientes & Uruguay",
    barrio: "Los Polvorines Noroeste",
    lat: -34.510,
    lng: -58.724,
    radiusMeters: 380,
    totalIncidents: 16,
    armedIncidents: 16,
    pctArmed: 100.0,
    bunkersCount: 2,
    comisaria: "Comisaría 2da (Los Polvorines)",
    nivelRiesgo: "ALTO",
    callesClave: [
      "SOLDADOS EXCOMBATIENTES DE MALVINAS al 380",
      "SOLDADOS EXCOMBATIENTES y Uruguay",
      "URUGUAY y Excombatientes"
    ],
    sustanciasDominantes: ["COCAÍNA"],
    franjaCritica: "Noche (21-04 hs)",
    modusOperandi: "Tasa de armamento del 100%: la totalidad de denuncias reportan armas de fuego o disparos. Operatoria nocturna de alta peligrosidad.",
    intervencionSugerida: "Acción táctica en franja de madrugada con cobertura blindada. Protección de denunciantes y relevamiento pericial de impactos balísticos.",
    renabapCercano: "Barrio Popular Santa Elena"
  }
];
