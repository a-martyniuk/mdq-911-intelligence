import os
import re
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INPUT_DIR = os.path.join(BASE_DIR, "9_9_2026 Drogas Jose C Paz")
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "processed")
PUBLIC_OUTPUT_DIR = os.path.join(BASE_DIR, "public", "data", "processed")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_OUTPUT_DIR, exist_ok=True)

def fix_coord(val, coord_type='lat'):
    if pd.isnull(val):
        return np.nan
    try:
        f = float(val)
        if f == 0:
            return np.nan
        while abs(f) > 100:
            f = f / 10.0
        
        # Bounds for José C. Paz / GBA
        if coord_type == 'lat':
            if -35.0 <= f <= -34.0:
                return f
        else:
            if -59.5 <= f <= -58.0:
                return f
        return np.nan
    except:
        return np.nan

def extract_sustancias(text):
    text_u = str(text).upper()
    sustancias = []
    if "COCAIN" in text_u or "MERCAL" in text_u or "BLANCA" in text_u:
        sustancias.append("COCAÍNA")
    if "PACO" in text_u or "PASTA BASE" in text_u:
        sustancias.append("PACO")
    if "MARIHUAN" in text_u or "FASO" in text_u or "FLORES" in text_u or "HIERBA" in text_u or "PORRO" in text_u:
        sustancias.append("MARIHUANA")
    if "PASTILLA" in text_u or "EXTASIS" in text_u or "ACIDO" in text_u:
        sustancias.append("SINTÉTICAS / PASTILLAS")
    
    if not sustancias:
        return "NO ESPECIFICADA / POLIRUBRO"
    return " / ".join(sustancias)

def check_armas(text):
    text_u = str(text).upper()
    arma_keywords = ["ARMA", "TIRO", "DISPAR", "PISTOL", "REVOLVER", "ESCOPET", "CALIBRE", "BALA", "BALACERA", "9MM"]
    return any(kw in text_u for kw in arma_keywords)

def extract_tipo_lugar(text, comment=""):
    combined = (str(text) + " " + str(comment)).upper()
    if "BUNKER" in combined or "BÚNKER" in combined or "CASILLA" in combined or "CHAPA" in combined or "BALDIO" in combined or "BALDÍO" in combined:
        return "Búnker / Casilla / Baldío"
    if "VENTANITA" in combined or "VENTANA" in combined or "KIOSCO" in combined or "QUIOSCO" in combined:
        return "Ventanita / Kiosco"
    if "PASILLO" in combined:
        return "Pasillo de Asentamiento"
    if "ESQUINA" in combined or "VIA PUBLICA" in combined or "VÍA PÚBLICA" in combined or "VEREDA" in combined:
        return "Vía Pública / Esquina"
    if "CASA" in combined or "FINCA" in combined or "PROPIEDAD" in combined or "DEPARTAMENTO" in combined:
        return "Finca / Vivienda"
    return "Lugar No Especificado"

def extract_alias(text):
    text_s = str(text)
    patterns = [
        r'(?:ALIAS|AL CUAL LE DICEN|LE DICEN|APODADO|CONOCIDO COMO)\s+[\*\"\'\“]?([A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]{2,20})[\*\"\'\”\.\,\_\s]',
        r'(?:SE LLAMA|SE TRATA DE|NOMBRE DE)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+)',
    ]
    found = []
    for pat in patterns:
        matches = re.findall(pat, text_s, re.IGNORECASE)
        for m in matches:
            cleaned = m.strip().strip('*\"\'_')
            if len(cleaned) > 2 and cleaned.upper() not in ["UNA FEMENINA", "UN MASCULINO", "DROGA", "DROGAS", "LA POLICIA"]:
                found.append(cleaned.title())
    return list(dict.fromkeys(found))[:3]

def extract_barrio(comment, addr=""):
    combined = (str(comment) + " " + str(addr)).upper()
    barrios = [
        "BARRIO LA PAZ", "BARRIO LAMAS", "CASITAS DE LAMAS", "SOL Y VERDE", 
        "VUCETICH", "FRINO", "PIÑERO", "PIÑEYRO", "SAN ATILIO", "YAPEYU", 
        "ALBERDI", "ALTOS DE JOSE C PAZ", "EL TIMON", "PRIMAVERA", "SANTA PAULA"
    ]
    for b in barrios:
        if b in combined:
            return b.title()
    return "José C. Paz (Centro / General)"

def get_franja(h):
    if 0 <= h < 6:
        return "Madrugada (00-06 hs)"
    elif 6 <= h < 12:
        return "Mañana (06-12 hs)"
    elif 12 <= h < 18:
        return "Tarde (12-18 hs)"
    else:
        return "Noche (18-24 hs)"

def run_etl_jcp():
    print("--- INICIANDO ETL DROGAS JOSÉ C. PAZ ---")
    files = [
        ("DROGAS ILICITAS JOSE C PAZ.xlsx", "DROGAS_ILICITAS_FORMAL", "Despacho Formal Drogas 911"),
        ("INFORMACION.xlsx", "INTELIGENCIA_RELATO_KEYWORDS", "Alerta Vecinal por Relato (Búnker/Venta)")
    ]
    
    dfs = []
    for fname, orig_code, orig_label in files:
        fpath = os.path.join(INPUT_DIR, fname)
        if os.path.exists(fpath):
            print(f"Cargando {fname} ({orig_label})...")
            df = pd.read_excel(fpath)
            df['Origen_Dataset'] = orig_code
            df['Origen_Label'] = orig_label
            dfs.append(df)
        else:
            print(f"ADVERTENCIA: No se encontró {fpath}")
            
    if not dfs:
        raise FileNotFoundError("No se encontraron archivos en " + INPUT_DIR)
        
    df_raw = pd.concat(dfs, ignore_index=True)
    print(f"Total registros leídos: {len(df_raw)}")
    
    df_clean = df_raw.drop_duplicates(subset=['ID']).copy()
    print(f"Registros únicos tras deduplicar ID: {len(df_clean)}")
    
    df_clean['Fecha_DT'] = pd.to_datetime(df_clean['Fecha'], errors='coerce')
    df_clean['Fecha'] = df_clean['Fecha_DT'].dt.strftime('%Y-%m-%d %H:%M')
    df_clean['Hora'] = df_clean['Fecha_DT'].dt.hour
    df_clean['Dia_Semana'] = df_clean['Fecha_DT'].dt.day_name().map({
        'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miércoles',
        'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sábado', 'Sunday': 'Domingo'
    })
    df_clean['Franja_Horaria'] = df_clean['Hora'].apply(lambda h: get_franja(h) if pd.notnull(h) else "Desconocida")
    
    df_clean['Latitud_Clean'] = df_clean['Latitud'].apply(lambda v: fix_coord(v, 'lat'))
    df_clean['Longitud_Clean'] = df_clean['Longitud'].apply(lambda v: fix_coord(v, 'lon'))
    
    valid_coords = df_clean['Latitud_Clean'].notnull().sum()
    print(f"Coordenadas normalizadas: {valid_coords} ({valid_coords/len(df_clean)*100:.1f}%)")
    
    print("Ejecutando procesamiento NLP sobre relatos...")
    df_clean['Sustancia_Detectada'] = df_clean['Relato'].apply(extract_sustancias)
    df_clean['Tiene_Armas'] = df_clean['Relato'].apply(check_armas)
    df_clean['Tipo_Punto_Venta'] = df_clean.apply(lambda r: extract_tipo_lugar(r['Relato'], r.get('comentario', '')), axis=1)
    df_clean['Alias_Identificados'] = df_clean['Relato'].apply(extract_alias)
    df_clean['Barrio_Detectado'] = df_clean.apply(lambda r: extract_barrio(r.get('comentario', ''), r.get('Dirección', '')), axis=1)
    
    df_clean['Tipo'] = "NARCOCRIMINALIDAD"
    df_clean['SubTipo'] = df_clean['Sustancia_Detectada']
    df_clean['Partido'] = "JOSE C PAZ"
    
    csv_out = os.path.join(OUTPUT_DIR, "jcp_drogas_consolidado.csv")
    json_out = os.path.join(OUTPUT_DIR, "jcp_drogas_consolidado.json")
    
    records = []
    for _, r in df_clean.iterrows():
        rec = {
            "id": int(r['ID']) if pd.notnull(r['ID']) else 0,
            "ID": int(r['ID']) if pd.notnull(r['ID']) else 0,
            "fecha": str(r['Fecha']) if pd.notnull(r['Fecha']) else "",
            "Fecha": str(r['Fecha']) if pd.notnull(r['Fecha']) else "",
            "hora": int(r['Hora']) if pd.notnull(r['Hora']) else 12,
            "Hora": int(r['Hora']) if pd.notnull(r['Hora']) else 12,
            "franja": str(r['Franja_Horaria']),
            "Franja_Horaria": str(r['Franja_Horaria']),
            "dia": str(r['Dia_Semana']),
            "Dia_Semana": str(r['Dia_Semana']),
            "direccion": str(r['Dirección']) if pd.notnull(r['Dirección']) else "José C. Paz",
            "Dirección": str(r['Dirección']) if pd.notnull(r['Dirección']) else "José C. Paz",
            "lat": float(r['Latitud_Clean']) if pd.notnull(r['Latitud_Clean']) else None,
            "Latitud_Clean": float(r['Latitud_Clean']) if pd.notnull(r['Latitud_Clean']) else None,
            "lng": float(r['Longitud_Clean']) if pd.notnull(r['Longitud_Clean']) else None,
            "Longitud_Clean": float(r['Longitud_Clean']) if pd.notnull(r['Longitud_Clean']) else None,
            "relato": str(r['Relato']) if pd.notnull(r['Relato']) else "",
            "Relato": str(r['Relato']) if pd.notnull(r['Relato']) else "",
            "comentario": str(r['comentario']) if pd.notnull(r.get('comentario')) else "",
            "origen": str(r['Origen_Dataset']),
            "Origen_Dataset": str(r['Origen_Dataset']),
            "origenLabel": str(r['Origen_Label']),
            "tipo": "NARCOCRIMINALIDAD",
            "Tipo": "NARCOCRIMINALIDAD",
            "subtipo": str(r['Sustancia_Detectada']),
            "SubTipo": str(r['Sustancia_Detectada']),
            "sustancia": str(r['Sustancia_Detectada']),
            "Sustancia": str(r['Sustancia_Detectada']),
            "tieneArmas": bool(r['Tiene_Armas']),
            "Tiene_Armas": bool(r['Tiene_Armas']),
            "tipoLugar": str(r['Tipo_Punto_Venta']),
            "Tipo_Punto_Venta": str(r['Tipo_Punto_Venta']),
            "alias": r['Alias_Identificados'],
            "Alias_Identificados": r['Alias_Identificados'],
            "barrio": str(r['Barrio_Detectado']),
            "Barrio_Detectado": str(r['Barrio_Detectado'])
        }
        records.append(rec)
        
    df_clean.to_csv(csv_out, index=False, encoding='utf-8')
    with open(json_out, 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    # Copiar a public para acceso estático
    with open(os.path.join(PUBLIC_OUTPUT_DIR, "jcp_drogas_consolidado.json"), 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    df_clean.to_csv(os.path.join(PUBLIC_OUTPUT_DIR, "jcp_drogas_consolidado.csv"), index=False, encoding='utf-8')
        
    print(f"\n[ÉXITO] Archivos generados y replicados en public:")
    print(f"  - Total registros: {len(records):,}")
    print(f"  - Despachos Formales Drogas: {len(df_clean[df_clean['Origen_Dataset']=='DROGAS_ILICITAS_FORMAL']):,}")
    print(f"  - Alertas por Palabras Clave en Relato: {len(df_clean[df_clean['Origen_Dataset']=='INTELIGENCIA_RELATO_KEYWORDS']):,}")

if __name__ == "__main__":
    run_etl_jcp()
