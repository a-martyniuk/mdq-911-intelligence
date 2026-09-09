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

STOPWORDS_BLACKLIST = {
    "LA PERSONA", "LAS PERSONAS", "UNA PERSONA", "EL QUE", "LOS QUE", "LA QUE", "LAS QUE",
    "EL OTRO", "LOS OTROS", "LA OTRA", "ELLOS", "ELLAS", "UN MASCULINO", "UNA FEMENINA",
    "DOS MASCULINOS", "VARIOS MASCULINOS", "TRES MASCULINOS", "CUATRO MASCULINOS",
    "EL CHICO", "LOS CHICOS", "EL TRANZA", "LOS TRANZAS", "UN TRANZA", "LOS TRANSAS", "EL TRANSA",
    "EL LUGAR", "LA CASA", "LA CASILLA", "LA FINCA", "LA PROPIEDAD", "LA POLICIA", "EL MOVIL",
    "EL PATRULLERO", "UN SUJETO", "LOS SUJETOS", "ESTA GENTE", "UN HOMBRE", "UNA MUJER",
    "EL VECINO", "LA VECINA", "EL DUEÑO", "LA DUEÑA", "EL HERMANO", "LA HERMANA", "EL HIJO",
    "LA HIJA", "EL MARIDO", "LA PAREJA", "LA MADRE", "EL PADRE", "DESCONOCE", "NO SABE",
    "NO RECUERDA", "SIN DATOS", "DROGA", "DROGAS", "COCAINA", "MARIHUANA", "PACO",
    "UNA MOTO", "UN AUTO", "UNA CASILLA", "ALGUIEN", "NADIE", "CUALQUIERA",
    "UN PIBE", "LOS PIBES", "EL MENOR", "LOS MENORES", "EL GRUPO", "LOS JEFES",
    "EL", "LA", "LOS", "LAS", "DE", "DEL", "DE LOS", "DE LAS", "A LOS", "A LAS", "EN EL", "EN LA",
    "UNO", "UNA", "UN", "OTRO", "OTRA", "ESTE", "ESE", "AQUEL"
}

CUTOFF_WORDS = [
    r'\s+(?:Y\s+(?:A\s+OTRO|EL\s+OTRO|OTRO|OTRA|LA\s+OTRA))\b',
    r'\s+(?:ES\s+|TIENE\s+|VIVE\s+|ANDA\s+|VENDE\s+|ESTA\s+|ESTÁN\s+|QUE\s+|CON\s+|FUE\s+|HABIA\s+|HACE\s+|SE\s+|POR\s+|DE\s+|PARA\s+)\b',
    r'\s+(?:LA\s+CUAL|EL\s+CUAL|QUIEN|QUIENES|NO\s+SABE|NO\s+SE|PERO|DICE|REF|REFIERE)\b'
]

def clean_extracted_name(raw):
    s = raw.strip().strip('*\"\'_.,;:!?()[]{}')
    s = re.sub(r'^(?:UN\s+TAL\s+ALIAS|UN\s+TAL|UNA\s+TAL|ALIAS\s+EL|ALIAS\s+LA|ALIAS|EL\s+LLAMADO|LA\s+LLAMADA|AL\s+CUAL\s+LE\s+DICEN|LE\s+DICEN)\s+', '', s, flags=re.IGNORECASE)
    s = s.strip().strip('*\"\'_.,;:!?')
    
    for cw in CUTOFF_WORDS:
        s = re.split(cw, s, flags=re.IGNORECASE)[0]
    s = s.strip().strip('*\"\'_.,;:!?')
    
    if len(s) < 3 or len(s) > 28:
        return []
        
    s_upper = s.upper()
    if s_upper in STOPWORDS_BLACKLIST:
        return []
    for sw in STOPWORDS_BLACKLIST:
        if s_upper == sw:
            return []
            
    if " Y " in s_upper or " E " in s_upper:
        parts = re.split(r'\s+[YE]\s+', s, flags=re.IGNORECASE)
        res = []
        for p in parts:
            res.extend(clean_extracted_name(p))
        return res
        
    clean_name = s.title()
    if clean_name.upper() in STOPWORDS_BLACKLIST:
        return []
    return [clean_name]

def extract_smart_aliases(text):
    patterns = [
        r'(?:ALIAS|APODADO|APODADA|CONOCIDO COMO|CONOCIDA COMO|LE DICEN|LE APODAN)\s+[:\-\*\"\'\“]?\s*([^\,\.\;\_\(\)\n]+)',
        r'(?:SE LLAMA|DE NOMBRE|NOMBRE DE)\s+[:\-\*\"\'\“]?\s*([^\,\.\;\_\(\)\n]+)',
        r'APODO\s*[:\-\*\"\'\“]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ0-9\s]{2,20})'
    ]
    results = []
    for pat in patterns:
        matches = re.findall(pat, str(text), re.IGNORECASE)
        for m in matches:
            cleaned_list = clean_extracted_name(m)
            for c in cleaned_list:
                if c and c not in results:
                    results.append(c)
    return results

def fix_coord(val, coord_type='lat'):
    if pd.isnull(val):
        return np.nan
    try:
        f = float(val)
        if f == 0:
            return np.nan
        while abs(f) > 100:
            f = f / 10.0
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
    print("--- INICIANDO ETL DROGAS JOSÉ C. PAZ CON NLP INTELIGENTE ---")
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
            
    df_raw = pd.concat(dfs, ignore_index=True)
    df_clean = df_raw.drop_duplicates(subset=['ID']).copy()
    
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
    
    print("Ejecutando procesamiento NLP inteligente sobre relatos...")
    df_clean['Sustancia_Detectada'] = df_clean['Relato'].apply(extract_sustancias)
    df_clean['Tiene_Armas'] = df_clean['Relato'].apply(check_armas)
    df_clean['Tipo_Punto_Venta'] = df_clean.apply(lambda r: extract_tipo_lugar(r['Relato'], r.get('comentario', '')), axis=1)
    df_clean['Alias_Identificados'] = df_clean['Relato'].apply(extract_smart_aliases)
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

    with open(os.path.join(PUBLIC_OUTPUT_DIR, "jcp_drogas_consolidado.json"), 'w', encoding='utf-8') as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    df_clean.to_csv(os.path.join(PUBLIC_OUTPUT_DIR, "jcp_drogas_consolidado.csv"), index=False, encoding='utf-8')
        
    print(f"\n[ÉXITO] Archivos consolidados y guardados exitosamente ({len(records)} registros).")

if __name__ == "__main__":
    run_etl_jcp()
