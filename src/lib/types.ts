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
