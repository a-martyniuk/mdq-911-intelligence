// Datos Analíticos y Geoespaciales de los 10 Nodos Crónicos de Resistencia Criminal
// Generado a partir de la clusterización espacial de 1.763 despachos 911 en José C. Paz

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

export const CHRONIC_HOTSPOTS_JCP: ChronicHotspotNode[] = [
  {
    "id": 1,
    "name": "Nodo #1: JUAN JOSE CASTELLI y 3 De Febrero",
    "shortName": "JUAN JOSE CASTELLI y 3 De Febrero",
    "barrio": "Barrio Popular Frino / 9 de Julio",
    "lat": -34.52236,
    "lng": -58.78109,
    "radiusMeters": 380,
    "totalIncidents": 83,
    "armedIncidents": 61,
    "pctArmed": 73.5,
    "bunkersCount": 7,
    "comisaria": "Comisaría 3ra (Vucetich / Salvatori)",
    "nivelRiesgo": "SEVERO",
    "callesClave": [
      "JUAN JOSE CASTELLI y 3 De Febrero",
      "JUAN JOSE CASTELLI y Juan Carlos Gomez",
      "JUAN CARLOS GOMEZ y Juan Jose Castelli"
    ],
    "sustanciasDominantes": [
      "COCAÍNA",
      "NO ESPECIFICADA / POLIRUBRO"
    ],
    "franjaCritica": "Noche (18-24 hs)",
    "modusOperandi": "Comercialización intensiva en pasillos con vigías armados y puestos fijos de venta en esquinas.",
    "intervencionSugerida": "Operativo de saturación con corte perimetral en Castelli y apoyo de infantería para allanamientos simultáneos.",
    "renabapCercano": "Barrio Popular Frino / 9 de Julio"
  },
  {
    "id": 2,
    "name": "Nodo #2: RASTREADOR FOURNIER y Juan Bautista De Lasalle",
    "shortName": "RASTREADOR FOURNIER y Juan Bautista De Lasalle",
    "barrio": "Barrio Popular Sol y Verde II / Primavera",
    "lat": -34.5143,
    "lng": -58.79339,
    "radiusMeters": 380,
    "totalIncidents": 75,
    "armedIncidents": 55,
    "pctArmed": 73.3,
    "bunkersCount": 9,
    "comisaria": "Comisaría 2da (Barrio Frino)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "RASTREADOR FOURNIER y Juan Bautista De Lasalle",
      "RASTREADOR FOURNIER y Av Croacia",
      "AV CROACIA y LASALLE"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA"
    ],
    "franjaCritica": "Madrugada (00-06 hs)",
    "modusOperandi": "Tráfico y fraccionamiento sobre el corredor de vías del FFCC San Martín y calle Lasalle con rápida vía de escape férreo.",
    "intervencionSugerida": "Bloqueo coordinado de la traza férrea y patrullaje motorizado en calles transversales de Sol y Verde.",
    "renabapCercano": "Barrio Popular Sol y Verde II / Primavera"
  },
  {
    "id": 3,
    "name": "Nodo #3: CACIQUE COLIQUEO y Junin",
    "shortName": "CACIQUE COLIQUEO y Junin",
    "barrio": "Barrio Popular La Paz",
    "lat": -34.5309,
    "lng": -58.7364,
    "radiusMeters": 380,
    "totalIncidents": 61,
    "armedIncidents": 46,
    "pctArmed": 75.4,
    "bunkersCount": 7,
    "comisaria": "Comisaría 1ra (Centro)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "CACIQUE COLIQUEO y Junin",
      "JUNIN y Cacique Coliqueo",
      "ZUVIRIA y CHILE"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA"
    ],
    "franjaCritica": "Noche (18-24 hs)",
    "modusOperandi": "Distribución de estupefacientes en viviendas fortificadas con protección de custodias armadas («soldaditos»).",
    "intervencionSugerida": "Allanamiento nocturno con grupo táctico GAD / Halcón por alta presencia de armas de fuego cortas y largas.",
    "renabapCercano": "Barrio Popular La Paz"
  },
  {
    "id": 4,
    "name": "Nodo #4: SAN LORENZO y Pedro De Mendoza",
    "shortName": "SAN LORENZO y Pedro De Mendoza",
    "barrio": "Asentamiento San Lorenzo",
    "lat": -34.51934,
    "lng": -58.732,
    "radiusMeters": 380,
    "totalIncidents": 54,
    "armedIncidents": 53,
    "pctArmed": 98.1,
    "bunkersCount": 9,
    "comisaria": "Comisaría 1ra (Centro)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "SAN LORENZO y Pedro De Mendoza",
      "SAN LORENZO y Tres Sargentos",
      "SAN LORENZO al 4040"
    ],
    "sustanciasDominantes": [
      "COCAÍNA",
      "NO ESPECIFICADA / POLIRUBRO"
    ],
    "franjaCritica": "Noche (18-24 hs)",
    "modusOperandi": "Zona de extrema violencia y resistencia armada en límite intermunicipal con San Miguel. Más del 95% de los llamados denuncian armas y disparos.",
    "intervencionSugerida": "Prioridad máxima judicial: Intervención UFI Estupefacientes con clausura de búnkers y control estricto de accesos vehiculares.",
    "renabapCercano": "Asentamiento San Lorenzo"
  },
  {
    "id": 5,
    "name": "Nodo #5: CARACAS y Crucero La Argentina",
    "shortName": "CARACAS y Crucero La Argentina",
    "barrio": "Barrio Popular Sol y Verde Norte",
    "lat": -34.50391,
    "lng": -58.80798,
    "radiusMeters": 380,
    "totalIncidents": 49,
    "armedIncidents": 39,
    "pctArmed": 79.6,
    "bunkersCount": 9,
    "comisaria": "Comisaría 2da (Barrio Frino)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "CARACAS y Crucero La Argentina",
      "CRUCERO LA ARGENTINA y Caracas",
      "TRINIDAD y Crucero La Argentina"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA"
    ],
    "franjaCritica": "Noche (18-24 hs)",
    "modusOperandi": "Comercialización dentro de trama urbana precaria de asentamiento RENABAP Sol y Verde Norte.",
    "intervencionSugerida": "Incursión peatonal por pasillos y monitoreo con drones térmicos en horario de nocturnidad.",
    "renabapCercano": "Barrio Popular Sol y Verde Norte"
  },
  {
    "id": 6,
    "name": "Nodo #6: LAS TRES MARIAS y Ruta 24 (P)",
    "shortName": "LAS TRES MARIAS y Ruta 24 (P)",
    "barrio": "Barrio Popular Vucetich Sur",
    "lat": -34.53522,
    "lng": -58.79013,
    "radiusMeters": 380,
    "totalIncidents": 36,
    "armedIncidents": 19,
    "pctArmed": 52.8,
    "bunkersCount": 19,
    "comisaria": "Comisaría 3ra (Vucetich / Salvatori)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "LAS TRES MARIAS y Ruta 24 (P)",
      "LAS TRES MARIAS y Pedro De Uriarte",
      "LAS TRES MARIAS al 6272"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA / MARIHUANA"
    ],
    "franjaCritica": "Madrugada (00-06 hs)",
    "modusOperandi": "Complejo de búnkers fortificados con rejas, chapas reforzadas y ventanitas metálicas de expendio directo.",
    "intervencionSugerida": "Despliegue de maquinaria pesada y herramientas de corte para derribo de construcciones clandestinas.",
    "renabapCercano": "Barrio Popular Vucetich Sur"
  },
  {
    "id": 7,
    "name": "Nodo #7: LARTIGAU LESPADA y Crucero La Argentina",
    "shortName": "LARTIGAU LESPADA y Crucero La Argentina",
    "barrio": "Barrio Popular Crucero La Argentina",
    "lat": -34.49666,
    "lng": -58.81591,
    "radiusMeters": 380,
    "totalIncidents": 35,
    "armedIncidents": 30,
    "pctArmed": 85.7,
    "bunkersCount": 6,
    "comisaria": "Comisaría 2da (Barrio Frino)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "LARTIGAU LESPADA y Crucero La Argentina",
      "LARTIGAU LESPADA y Corbeta La Uruguay",
      "CRUCERO LA ARGENTINA y Lartigau Lespada"
    ],
    "sustanciasDominantes": [
      "COCAÍNA / MARIHUANA",
      "NO ESPECIFICADA / POLIRUBRO"
    ],
    "franjaCritica": "Noche (18-24 hs)",
    "modusOperandi": "Zona fronteriza con Pilar / Tortuguitas utilizada para ocultamiento de cargamentos y reabastecimiento.",
    "intervencionSugerida": "Control de saturación en accesos viales y coordinación interjurisdiccional con Departamental Pilar.",
    "renabapCercano": "Barrio Popular Crucero La Argentina"
  },
  {
    "id": 8,
    "name": "Nodo #8: BUENOS AIRES y Carabobo",
    "shortName": "BUENOS AIRES y Carabobo",
    "barrio": "Barrio Piñero",
    "lat": -34.51805,
    "lng": -58.80439,
    "radiusMeters": 380,
    "totalIncidents": 29,
    "armedIncidents": 20,
    "pctArmed": 69.0,
    "bunkersCount": 7,
    "comisaria": "Comisaría 1ra (Centro)",
    "nivelRiesgo": "SEVERO",
    "callesClave": [
      "BUENOS AIRES y Carabobo",
      "BUENOS AIRES al 5032",
      "BUENOS AIRES al 5010"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA / MARIHUANA"
    ],
    "franjaCritica": "Tarde (12-18 hs)",
    "modusOperandi": "Punto de venta y aguantadero en viviendas particulares con atención en horario vespertino/nocturno.",
    "intervencionSugerida": "Vigilancia encubierta y recopilación de material fílmico para individualización de cabecillas.",
    "renabapCercano": "Barrio Piñero"
  },
  {
    "id": 9,
    "name": "Nodo #9: POTOSI al 3930",
    "shortName": "POTOSI al 3930",
    "barrio": "Barrio Popular Vucetich Central",
    "lat": -34.52725,
    "lng": -58.77564,
    "radiusMeters": 380,
    "totalIncidents": 29,
    "armedIncidents": 26,
    "pctArmed": 89.7,
    "bunkersCount": 3,
    "comisaria": "Comisaría 3ra (Vucetich / Salvatori)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "POTOSI al 3930",
      "JULIO ACERBONI al 3874",
      "JULIO ACERBONI y 3 DE FEBRERO"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA"
    ],
    "franjaCritica": "Tarde (12-18 hs)",
    "modusOperandi": "Venta al menudeo con uso de menores como campanas («campaneros») y delivery en ciclomotores.",
    "intervencionSugerida": "Control dinámico de motovehículos sin patente e interceptación selectiva en esquinas.",
    "renabapCercano": "Barrio Popular Vucetich Central"
  },
  {
    "id": 10,
    "name": "Nodo #10: CNEL SUAREZ y Juan A Casacuberta",
    "shortName": "CNEL SUAREZ y Juan A Casacuberta",
    "barrio": "Barrio Alberdi / San Salvador",
    "lat": -34.53076,
    "lng": -58.7595,
    "radiusMeters": 380,
    "totalIncidents": 28,
    "armedIncidents": 21,
    "pctArmed": 75.0,
    "bunkersCount": 2,
    "comisaria": "Comisaría 1ra (Centro)",
    "nivelRiesgo": "CRÍTICO",
    "callesClave": [
      "CNEL SUAREZ y Juan A Casacuberta",
      "JUAN A CASACUBERTA y Cnel Suarez",
      "JUAN A CASACUBERTA al 4967"
    ],
    "sustanciasDominantes": [
      "NO ESPECIFICADA / POLIRUBRO",
      "COCAÍNA"
    ],
    "franjaCritica": "Madrugada (00-06 hs)",
    "modusOperandi": "Comercialización en zona comercial/residencial con afluencia peatonal y conexión hacia el centro de trasbordo.",
    "intervencionSugerida": "Puestos policiales fijos disuasivos y patrullaje a pie en horarios de entrada/salida escolar y comercial.",
    "renabapCercano": "Barrio Alberdi / San Salvador"
  }
];
