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

def extract_barrio(comment, addr="", lat=None, lng=None, relato="", calle=""):
    combined = (str(comment) + " " + str(addr) + " " + str(relato) + " " + str(calle)).upper()
    
    # 1. Text-based explicit match
    if "SOL Y VERDE" in combined or "POLONIA" in combined or "CROACIA" in combined:
        return "Sol y Verde"
    if "FRINO" in combined or "CASTELLI" in combined or "FRINOS" in combined:
        return "Barrio Frino"
    if "VUCETICH" in combined or "SALVATORI" in combined or "DAVAINE" in combined or "CARRIO" in combined:
        return "Vucetich / Salvatori"
    if "SAN ATILIO" in combined or "GRANADEROS" in combined:
        return "San Atilio"
    if "LAMAS" in combined or "SAAVEDRA LAMAS" in combined or "MARCHENA" in combined or "CASITAS DE LAMAS" in combined:
        return "Barrio Lamas"
    if "LA PAZ" in combined or "PANAMA" in combined or "CANAL DE PANAMA" in combined:
        return "Barrio La Paz"
    if "KIRCHNER" in combined or "NESTOR KIRCHNER" in combined:
        return "Néstor Kirchner"
    if "CEIBO" in combined or "EL CEIBO" in combined or "PROVIDENCIA" in combined:
        return "El Ceibo"
    if "YAPEYU" in combined or "SAN ROQUE" in combined:
        return "Yapeyú"
    if "LEON" in combined or "BARRIO LEON" in combined or "CONCEJAL ALFONSO" in combined:
        return "Barrio León"
    if "ALTUBE" in combined or "ESTACION JOSE C PAZ" in combined:
        return "José C. Paz Centro"

    # 2. Spatial proximity based on validated neighborhood centroids
    if pd.notnull(lat) and pd.notnull(lng):
        try:
            lat_f = float(lat)
            lng_f = float(lng)
            if lat_f != 0 and lng_f != 0:
                barrios_jcp_centroids = {
                    "San Atilio": (-34.5240, -58.7820),
                    "Sol y Verde": (-34.5325, -58.7915),
                    "Barrio Frino": (-34.5070, -58.7610),
                    "El Ceibo": (-34.5290, -58.7560),
                    "Barrio León": (-34.5120, -58.7350),
                    "Vucetich / Salvatori": (-34.5420, -58.7720),
                    "Barrio La Paz": (-34.5210, -58.7650),
                    "Piñero / San Martín": (-34.5250, -58.7470),
                    "Barrio Lamas": (-34.5028, -58.7482),
                    "Yapeyú": (-34.5180, -58.7710),
                    "Néstor Kirchner": (-34.5385, -58.7845),
                    "José C. Paz Centro": (-34.5160, -58.7520),
                }
                closest_b = min(
                    barrios_jcp_centroids.keys(),
                    key=lambda b: (lat_f - barrios_jcp_centroids[b][0])**2 + (lng_f - barrios_jcp_centroids[b][1])**2
                )
                return closest_b
        except Exception:
            pass

    return "José C. Paz (Sin Georreferenciar)"

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
        ("INFORMACION.xlsx", "INFORMACION_VECINAL_KEYWORDS", "Alerta Vecinal por Relato (Búnker/Venta)")
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

    def norm_street(s):
        if not s or pd.isnull(s): return ''
        s = str(s).strip().upper()
        s = re.sub(r'^(?:AV\.?|AVDA\.?|CALLE|PASAJE|PJE\.?|PJE|DIAGONAL|BV\.?|BOULEVARD|RUTA)\s+', '', s)
        s = re.sub(r'^(?:PRES\.?|PRESIDENTE|GRAL\.?|GENERAL|TNTE\.?|TENIENTE|DR\.?|DOCTOR|MONSEÑOR|PBTRO\.?)\s+', '', s)
        s = re.sub(r'\s+', ' ', s).strip()
        return s

    # Construcción de base de referencia de calles a partir de registros ya georreferenciados
    geocoded_initial = df_clean[df_clean['Latitud_Clean'].notnull() & df_clean['Longitud_Clean'].notnull()]
    street_db = {}
    for _, r in geocoded_initial.iterrows():
        c = norm_street(r.get('calle'))
        if c and len(c) > 2:
            if c not in street_db: street_db[c] = []
            street_db[c].append((r['Latitud_Clean'], r['Longitud_Clean']))

    street_centroids = {k: (sum(p[0] for p in v)/len(v), sum(p[1] for p in v)/len(v)) for k, v in street_db.items()}

    # Catálogo suplementario de arterias y esquinas clave de José C. Paz
    extra_streets = {
        'ANTONIO MARCHENA': (-34.5042, -58.7315),
        'MARCHENA': (-34.5042, -58.7315),
        'LAMAS': (-34.5028, -58.7482),
        'JOSE LAMAS': (-34.5028, -58.7482),
        '12 DE OCTUBRE': (-34.5165, -58.7580),
        'CASACUBERTA': (-34.5245, -58.7660),
        'QUIROZ': (-34.5285, -58.7725),
        'NORUEGA': (-34.5360, -58.7890),
        'P.FIGARI': (-34.4890, -58.7280),
        'FIGARI': (-34.4890, -58.7280),
        'PEDRO FIGARI': (-34.4890, -58.7280),
        'FABRICA DE CERAMICA ALBERDI': (-34.5050, -58.7500),
        'SAN LUIS': (-34.5135, -58.7640),
        'RENE FAVALORO': (-34.5065, -58.7750),
        'CASTELLI': (-34.5190, -58.7520),
        'JUAN JOSE CASTELLI': (-34.5190, -58.7520),
        'DAVAINE': (-34.5410, -58.7745),
        'PANAMA': (-34.5295, -58.7650),
        'CANAL DE PANAMA': (-34.5295, -58.7650),
        'PRIMER PASAJE': (-34.5180, -58.7600),
        'DORREGO': (-34.5140, -58.7560),
        'ISLAS CANARIAS': (-34.5210, -58.7780),
        'CHESSI': (-34.5150, -58.7510),
        'BALESTEROS': (-34.5175, -58.7620),
        'FLORENCIO BALLESTEROS': (-34.5175, -58.7620),
        'CEIBO': (-34.5290, -58.7560),
        'SANTA FE': (-34.5120, -58.7600),
        'CRUZ VARELA': (-34.5275, -58.7730),
        'JUAN CRUZ VARELA': (-34.5275, -58.7730),
        'ARAGON': (-34.5055, -58.7305),
        'FOURNIER': (-34.5300, -58.7660),
        'CRAMER': (-34.4885, -58.7275),
        'CARRIO': (-34.5415, -58.7740),
        'SANTA MARTA': (-34.5185, -58.7515),
        'HUACHI': (-34.5200, -58.7530),
        'TEGUCIGALPA': (-34.5220, -58.7490),
        '197': (-34.5170, -58.7590),
        'RUTA 197': (-34.5170, -58.7590),
        'HIPOLITO YRIGOYEN': (-34.5170, -58.7590),
        'AV HIPOLITO YRIGOYEN': (-34.5170, -58.7590),
        'RUTA 8': (-34.4920, -58.7310),
        'ILLIA': (-34.4920, -58.7310),
        'PRES ARTURO UMBERTO ILLIA': (-34.4920, -58.7310),
        'ARTURO ILLIA': (-34.4920, -58.7310),
        'POLONIA': (-34.5320, -58.7910),
        'PIÑERO': (-34.5325, -58.7905),
        'CANNING': (-34.5160, -58.7610),
        'FELIX DE AZARA': (-34.5165, -58.7620),
        'CORBETA URUGUAY': (-34.5220, -58.7470),
        'SAN BLAS': (-34.5215, -58.7475),
        'VIENA': (-34.5255, -58.7540),
        'BOYACA': (-34.5195, -58.7585),
        'COMBATE DE LOS POZOS': (-34.5230, -58.7615),
        'CURUPAYTI': (-34.5235, -58.7620),
        'JUAN DIAZ DE SOLIS': (-34.5145, -58.7530),
        'JORGE NEWBERY': (-34.5280, -58.7690),
        'MATEO BOOTZ': (-34.5270, -58.7680),
        'RODRIGO DE TRIANA': (-34.5310, -58.7750),
        'FRAY BUTLER': (-34.5160, -58.7440),
        'JUAN PABLO ECHAGUE': (-34.5140, -58.7460),
        'JOSE ANTONIO PAEZ': (-34.5110, -58.7480),
        'JUANA MANUELA GORRITI': (-34.5200, -58.7790),
        'GRANADEROS': (-34.5150, -58.7550),
        'AV CROACIA': (-34.5340, -58.7820),
        'CROACIA': (-34.5340, -58.7820),
        'AV SAAVEDRA LAMAS': (-34.5028, -58.7482),
        'SAAVEDRA LAMAS': (-34.5028, -58.7482),
        'BOLIVAR': (-34.5175, -58.7595),
        'PRES RIVADAVIA': (-34.5130, -58.7630),
        'RIVADAVIA': (-34.5130, -58.7630)
    }
    for k, v in extra_streets.items():
        if k not in street_centroids:
            street_centroids[k] = v

    # Centroides barriales y asentamientos de José C. Paz
    known_barrios = {
        'BARRIO LAMAS': (-34.5025, -58.7485),
        'CASITAS DE LAMAS': (-34.5030, -58.7490),
        'SAAVEDRA LAMAS': (-34.5028, -58.7482),
        'NESTOR KIRCHNER': (-34.5385, -58.7845),
        'KIRCHNER': (-34.5385, -58.7845),
        'SOL Y VERDE': (-34.5320, -58.7910),
        'FAVALORO': (-34.5065, -58.7750),
        'RENE FAVALORO': (-34.5065, -58.7750),
        'EL CEIBO': (-34.5290, -58.7560),
        'LA SONIA': (-34.5010, -58.7350),
        'FRINO': (-34.5070, -58.7610),
        'FRINOS': (-34.5070, -58.7610),
        'BARRIO LEON': (-34.5120, -58.7420),
        'BARRIO DE LEON': (-34.5120, -58.7420),
        'LEON': (-34.5120, -58.7420),
        'CONSEJAL ALFONFO': (-34.5120, -58.7420),
        'CONCEJAL ALFONSO': (-34.5120, -58.7420),
        'SAN ATILIO': (-34.5240, -58.7820),
        'VUCETICH': (-34.5420, -58.7720),
        'YAPEYU': (-34.5180, -58.7710),
        'ALBERDI': (-34.5050, -58.7500),
        'LA ESPERANZA': (-34.5040, -58.7310),
        'ESPERANZA': (-34.5040, -58.7310),
        'BARRIO LA PAZ': (-34.5210, -58.7650),
        'PLAZA DE LA PAZ': (-34.5210, -58.7650),
        'SANTA PAULA': (-34.5350, -58.7700),
        'PRIMAVERA': (-34.5150, -58.7450),
        'EL CORREDOR': (-34.5250, -58.7600),
        'RUTA 8': (-34.4920, -58.7310),
        'PUMA': (-34.4920, -58.7310)
    }

    # Geocodificación en cascada de los registros que no tenían coordenadas iniciales
    recovered_count = 0
    precisions = []

    for idx, r in df_clean.iterrows():
        orig_lat = r['Latitud_Clean']
        orig_lng = r['Longitud_Clean']
        
        if pd.notnull(orig_lat) and pd.notnull(orig_lng):
            precisions.append("EXACTA_DESPACHO")
            continue
            
        c = norm_street(r.get('calle'))
        cs = norm_street(r.get('calleSuperior'))
        ci = norm_street(r.get('calleInferior'))
        comb = (str(r.get('comentario', '')) + ' ' + str(r.get('Dirección', '')) + ' ' + str(r.get('Relato', ''))).upper()
        
        # 1. Intersección calle + calleSuperior / calleInferior
        if c in street_centroids and cs in street_centroids and c not in ['OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF']:
            p1 = street_centroids[c]
            p2 = street_centroids[cs]
            df_clean.at[idx, 'Latitud_Clean'] = round((p1[0] + p2[0]) / 2, 6)
            df_clean.at[idx, 'Longitud_Clean'] = round((p1[1] + p2[1]) / 2, 6)
            precisions.append("INTERSECCION_ESQUINA")
            recovered_count += 1
            continue
            
        if c in street_centroids and ci in street_centroids and c not in ['OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF']:
            p1 = street_centroids[c]
            p2 = street_centroids[ci]
            df_clean.at[idx, 'Latitud_Clean'] = round((p1[0] + p2[0]) / 2, 6)
            df_clean.at[idx, 'Longitud_Clean'] = round((p1[1] + p2[1]) / 2, 6)
            precisions.append("INTERSECCION_ESQUINA")
            recovered_count += 1
            continue

        # 2. Centroide de calle principal
        if c in street_centroids and c not in ['OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF']:
            p = street_centroids[c]
            df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
            df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
            precisions.append("CENTROIDE_CALLE")
            recovered_count += 1
            continue

        # 3. Centroide de calle transversal si la principal fue genérica
        if cs in street_centroids and cs not in ['OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF']:
            p = street_centroids[cs]
            df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
            df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
            precisions.append("TRANSVERSAL_ESQUINA")
            recovered_count += 1
            continue

        if ci in street_centroids and ci not in ['OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF']:
            p = street_centroids[ci]
            df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
            df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
            precisions.append("TRANSVERSAL_ESQUINA")
            recovered_count += 1
            continue

        # 4. Centroide Barrial / Asentamiento
        found_barrio = False
        for b_name, b_pt in known_barrios.items():
            if b_name in comb:
                df_clean.at[idx, 'Latitud_Clean'] = round(b_pt[0], 6)
                df_clean.at[idx, 'Longitud_Clean'] = round(b_pt[1], 6)
                precisions.append("CENTROIDE_BARRIO")
                recovered_count += 1
                found_barrio = True
                break
        if found_barrio:
            continue

        # Sin datos suficientes para geocodificar fehacientemente
        precisions.append("SIN_LOCALIZACION")

    df_clean['Precision_Geo'] = precisions
    print(f"Geocodificación automática completada: {recovered_count} registros recuperados exitosamente.")

    print("Ejecutando procesamiento NLP inteligente sobre relatos...")
    df_clean['Sustancia_Detectada'] = df_clean['Relato'].apply(extract_sustancias)
    df_clean['Tiene_Armas'] = df_clean['Relato'].apply(check_armas)
    df_clean['Tipo_Punto_Venta'] = df_clean.apply(lambda r: extract_tipo_lugar(r['Relato'], r.get('comentario', '')), axis=1)
    df_clean['Alias_Identificados'] = df_clean['Relato'].apply(extract_smart_aliases)
    df_clean['Barrio_Detectado'] = df_clean.apply(
        lambda r: extract_barrio(
            r.get('comentario', ''),
            r.get('Dirección', ''),
            r.get('Latitud_Clean'),
            r.get('Longitud_Clean'),
            r.get('Relato', ''),
            r.get('calle', '')
        ),
        axis=1
    )
    
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
            "calle": str(r['calle']).strip() if pd.notnull(r.get('calle')) else "",
            "altura": int(r['Altura']) if pd.notnull(r.get('Altura')) and str(r.get('Altura')).isdigit() else 0,
            "calleSuperior": str(r['calleSuperior']).strip() if pd.notnull(r.get('calleSuperior')) else "",
            "calleInferior": str(r['calleInferior']).strip() if pd.notnull(r.get('calleInferior')) else "",
            "lat": float(r['Latitud_Clean']) if pd.notnull(r['Latitud_Clean']) else None,
            "Latitud_Clean": float(r['Latitud_Clean']) if pd.notnull(r['Latitud_Clean']) else None,
            "lng": float(r['Longitud_Clean']) if pd.notnull(r['Longitud_Clean']) else None,
            "Longitud_Clean": float(r['Longitud_Clean']) if pd.notnull(r['Longitud_Clean']) else None,
            "precision_geo": str(r['Precision_Geo']),
            "Precision_Geo": str(r['Precision_Geo']),
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
        
    geocoded_total = sum(1 for r in records if r['lat'] is not None and r['lng'] is not None)
    print(f"\n[ÉXITO] Archivos consolidados y guardados exitosamente ({len(records)} registros).")
    print(f"[COBERTURA GEOGRÁFICA] {geocoded_total} / {len(records)} georreferenciados ({geocoded_total/len(records)*100:.2f}%).")

if __name__ == "__main__":
    run_etl_jcp()
