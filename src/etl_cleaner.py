import os
import re
import pandas as pd
import numpy as np

# Configuración de rutas
BASE_DIR = r"D:\Projects\Datos de Mar del Plata"
DATA_DIR = BASE_DIR
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Regex para patentes argentinas (Mercosur y Tradicional)
PATENTE_REGEX = re.compile(
    r'\b([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{1}\d{3}[A-Z]{3}|[A-Z]{3}\d{3}|\d{3}[A-Z]{3})\b',
    re.IGNORECASE
)

# Palabras de marcas comunes para extracción NLP
MARCAS_COMUNES = [
    'ZANELLA', 'GILERA', 'HONDA', 'YAMAHA', 'MOTOMEL', 'CORVEN', 'BAJAJ', 'CHEVROLET',
    'FORD', 'FIAT', 'VOLKSWAGEN', 'RENAULT', 'PEUGEOT', 'TOYOTA', 'CITROEN', 'NISSAN',
    'HYUNDAI', 'BMW', 'MERCEDES', 'SUZUKI', 'KTM', 'GUERRERO', 'MONDIAL', 'KEEWAY'
]

def fix_coord(val, coord_type='lat'):
    """Normaliza y repara coordenadas de latitud/longitud de General Pueyrredón."""
    if pd.isna(val):
        return np.nan
    val_str = f"{val:.0f}" if isinstance(val, (float, int)) else str(val).strip()
    val_str = val_str.replace('.', '').replace(',', '')
    
    if coord_type == 'lat':
        m = re.match(r'^(-3[78])(\d+)$', val_str)
        if m:
            fixed = float(f"{m.group(1)}.{m.group(2)}")
            if -38.25 <= fixed <= -37.75:
                return fixed
    elif coord_type == 'lng':
        m = re.match(r'^(-57)(\d+)$', val_str)
        if m:
            fixed = float(f"{m.group(1)}.{m.group(2)}")
            if -57.75 <= fixed <= -57.35:
                return fixed
    return np.nan

def extract_patentes(text):
    """Extrae lista de patentes vehiculares desde el texto del relato."""
    if pd.isna(text):
        return []
    clean_text = re.sub(r'[^A-Z0-9\s]', ' ', str(text).upper())
    matches = PATENTE_REGEX.findall(clean_text)
    return list(set(matches))

def extract_marca(text):
    """Detecta marca de vehículo mencionada en el relato."""
    if pd.isna(text):
        return 'NO ESPECIFICADO'
    text_upper = str(text).upper()
    for marca in MARCAS_COMUNES:
        if re.search(rf'\b{marca}\b', text_upper):
            return marca
    return 'OTRA / NO ESPECIFICADA'

def get_franja_horaria(hora):
    """Categoriza la hora en franjas operativas."""
    if pd.isna(hora):
        return 'DESCONOCIDO'
    h = int(hora)
    if 0 <= h < 6:
        return 'Madrugada (00-06)'
    elif 6 <= h < 12:
        return 'Mañana (06-12)'
    elif 12 <= h < 18:
        return 'Tarde (12-18)'
    else:
        return 'Noche (18-24)'

def clean_dataset(filepath, dataset_name):
    """Limpia y procesa un archivo Excel individual."""
    print(f"-> Procesando: {dataset_name}...")
    df = pd.read_excel(filepath)
    
    # Estandarización de nombres de columnas
    df.columns = [c.strip() for c in df.columns]
    
    # Coordenadas limpias
    df['Latitud_Clean'] = df['Latitud'].apply(lambda x: fix_coord(x, 'lat'))
    df['Longitud_Clean'] = df['Longitud'].apply(lambda x: fix_coord(x, 'lng'))
    
    # Manejo de fechas y tiempos
    df['Fecha'] = pd.to_datetime(df['Fecha'], errors='coerce')
    df['Año'] = df['Fecha'].dt.year
    df['Mes'] = df['Fecha'].dt.month
    df['Mes_Nombre'] = df['Fecha'].dt.strftime('%B')
    df['Dia'] = df['Fecha'].dt.day
    df['Hora'] = df['Fecha'].dt.hour
    df['Dia_Semana_Num'] = df['Fecha'].dt.dayofweek
    
    dias_esp = {0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves', 4: 'Viernes', 5: 'Sábado', 6: 'Domingo'}
    df['Dia_Semana'] = df['Dia_Semana_Num'].map(dias_esp)
    df['Es_FinDeSemana'] = df['Dia_Semana_Num'].isin([5, 6])
    df['Franja_Horaria'] = df['Hora'].apply(get_franja_horaria)
    
    # NLP en campo Relato
    df['Patentes_Extraidas'] = df['Relato'].apply(extract_patentes)
    df['Patente_Principal'] = df['Patentes_Extraidas'].apply(lambda x: x[0] if len(x) > 0 else np.nan)
    df['Marca_Detectada'] = df['Relato'].apply(extract_marca)
    
    # Etiqueta de Origen
    df['Origen_Dataset'] = dataset_name
    
    return df

def run_etl():
    """Ejecuta el pipeline completo de ETL y guarda los archivos procesados."""
    print("==========================================")
    print("   INICIANDO PIPELINE ETL DE LIMPIEZA")
    print("==========================================")
    
    files_map = {
        "ROBO AUTO-MOTO.xlsx": "ROBO_AUTO_MOTO",
        "HALLAZGO AUTOMOTOR.xlsx": "HALLAZGO_AUTOMOTOR",
        "DISPAROS PERSONAS.xlsx": "DISPAROS_PERSONAS",
        "ARMA DE FUEGO.xlsx": "ARMA_FUEGO"
    }
    
    cleaned_dfs = {}
    for filename, code in files_map.items():
        filepath = os.path.join(DATA_DIR, filename)
        cleaned_dfs[code] = clean_dataset(filepath, code)
        
        # Guardar cada dataset limpio
        out_csv = os.path.join(PROCESSED_DIR, f"mdp_{code.lower()}_clean.csv")
        cleaned_dfs[code].to_csv(out_csv, index=False, encoding='utf-8-sig')
        print(f"   [Guardado]: {out_csv}")
        
    # Cruce de Robos y Hallazgos por Patente
    df_robo = cleaned_dfs["ROBO_AUTO_MOTO"]
    df_hallazgo = cleaned_dfs["HALLAZGO_AUTOMOTOR"]
    
    df_robo_pat = df_robo[df_robo['Patente_Principal'].notnull()].copy()
    df_hallazgo_pat = df_hallazgo[df_hallazgo['Patente_Principal'].notnull()].copy()
    
    # Merge por patente
    recuperados = pd.merge(
        df_robo_pat[['ID', 'Fecha', 'Patente_Principal', 'SubTipo', 'Dirección', 'Latitud_Clean', 'Longitud_Clean', 'Marca_Detectada', 'Relato']],
        df_hallazgo_pat[['ID', 'Fecha', 'Patente_Principal', 'Dirección', 'Latitud_Clean', 'Longitud_Clean', 'Relato']],
        on='Patente_Principal',
        suffixes=('_Robo', '_Hallazgo')
    )
    
    # Filtrar eventos donde el hallazgo es posterior o simultáneo al robo
    recuperados['Horas_Hasta_Hallazgo'] = (recuperados['Fecha_Hallazgo'] - recuperados['Fecha_Robo']).dt.total_seconds() / 3600.0
    recuperados = recuperados[recuperados['Horas_Hasta_Hallazgo'] >= 0].copy()
    recuperados['Dias_Hasta_Hallazgo'] = recuperados['Horas_Hasta_Hallazgo'] / 24.0
    
    out_recuperados = os.path.join(PROCESSED_DIR, "mdp_vehiculos_recuperados.csv")
    recuperados.to_csv(out_recuperados, index=False, encoding='utf-8-sig')
    print(f"\n[Cruce NLP]: Se identificaron {len(recuperados)} vehículos robados efectivamente hallados.")
    print(f"   [Guardado]: {out_recuperados}")
    
    # Dataset Consolidado
    cols_comunes = ['ID', 'Fecha', 'Año', 'Mes', 'Mes_Nombre', 'Dia', 'Hora', 'Dia_Semana', 'Es_FinDeSemana', 
                    'Franja_Horaria', 'Tipo', 'SubTipo', 'Dirección', 'Partido asignado', 'Localidad asignada',
                    'Latitud_Clean', 'Longitud_Clean', 'Patente_Principal', 'Marca_Detectada', 'Origen_Dataset', 'Relato']
    
    df_list = []
    for code, df in cleaned_dfs.items():
        existing_cols = [c for c in cols_comunes if c in df.columns]
        df_sub = df[existing_cols].copy()
        df_list.append(df_sub)
        
    df_consolidado = pd.concat(df_list, ignore_index=True)
    
    out_cons_csv = os.path.join(PROCESSED_DIR, "mdp_incidentes_consolidado.csv")
    out_cons_parquet = os.path.join(PROCESSED_DIR, "mdp_incidentes_consolidado.parquet")
    
    # Cast all object columns to string to avoid ArrowTypeError on parquet export
    for c in df_consolidado.select_dtypes(include=['object']).columns:
        df_consolidado[c] = df_consolidado[c].astype(str)
        
    df_consolidado.to_csv(out_cons_csv, index=False, encoding='utf-8-sig')
    df_consolidado.to_parquet(out_cons_parquet, index=False)
    
    print(f"\n[Consolidado]: {len(df_consolidado)} registros integrados.")
    print(f"   [Guardado CSV]: {out_cons_csv}")
    print(f"   [Guardado Parquet]: {out_cons_parquet}")
    print("==========================================")
    print("   ETL COMPLETADO CON ÉXITO")
    print("==========================================\n")
    return df_consolidado

if __name__ == "__main__":
    run_etl()
