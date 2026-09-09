export interface IncidentRecord {
  ID: number;
  Fecha: string;
  Año: number;
  Mes: number;
  Mes_Nombre: string;
  Dia: number;
  Hora: number;
  Dia_Semana: string;
  Es_FinDeSemana: boolean;
  Franja_Horaria: string;
  Tipo: string;
  SubTipo: string;
  Dirección: string;
  Partido_asignado?: string;
  Localidad_asignada?: string;
  Latitud_Clean?: number;
  Longitud_Clean?: number;
  Patente_Principal?: string;
  Marca_Detectada?: string;
  Origen_Dataset: string;
  Relato?: string;
}

export interface RecoveredVehicleRecord {
  ID_Robo: number;
  ID_Hallazgo: number;
  Fecha_Robo: string;
  Fecha_Hallazgo: string;
  Patente_Principal: string;
  SubTipo: string;
  Dirección_Robo: string;
  Dirección_Hallazgo: string;
  Latitud_Clean_Robo?: number;
  Longitud_Clean_Robo?: number;
  Latitud_Clean_Hallazgo?: number;
  Longitud_Clean_Hallazgo?: number;
  Marca_Detectada?: string;
  Horas_Hasta_Hallazgo: number;
  Dias_Hasta_Hallazgo: number;
}

export interface FilterState {
  tipo: string;
  subtipo: string;
  franjaHoraria: string;
  diaSemana: string;
  origenDataset: string;
}

export interface DictionaryItem {
  campo: string;
  tipo: string;
  descripcion: string;
  ejemplo: string;
  categoria: 'original' | 'derivada' | 'recuperacion';
}

export interface DrogasIncidentRecord {
  id: number;
  ID?: number;
  fecha: string;
  Fecha?: string;
  hora: number;
  Hora?: number;
  franja: string;
  Franja_Horaria?: string;
  dia: string;
  Dia_Semana?: string;
  direccion: string;
  Dirección?: string;
  lat?: number;
  Latitud_Clean?: number;
  lng?: number;
  Longitud_Clean?: number;
  relato: string;
  Relato?: string;
  comentario?: string;
  origen: "DROGAS_ILICITAS_FORMAL" | "INFORMACION_VECINAL_KEYWORDS";
  Origen_Dataset?: string;
  origenLabel?: string;
  tipo: string;
  Tipo?: string;
  subtipo: string;
  SubTipo?: string;
  sustancia: string;
  Sustancia?: string;
  tieneArmas: boolean;
  Tiene_Armas?: boolean;
  tipoLugar: string;
  Tipo_Punto_Venta?: string;
  alias: string[];
  Alias_Identificados?: string[];
  barrio: string;
  Barrio_Detectado?: string;
}
