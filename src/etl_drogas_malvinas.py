import os, re, json
import pandas as pd
import numpy as np

BASE_DIR = r'D:\Projects\MSEG'
INPUT_DIR = os.path.join(BASE_DIR, '10_9_2026 Malvinas Argentinas')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'processed')
PUBLIC_OUTPUT_DIR = os.path.join(BASE_DIR, 'public', 'data', 'processed')
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PUBLIC_OUTPUT_DIR, exist_ok=True)

STOPWORDS_BLACKLIST = {
    "LA PERSONA", "LAS PERSONAS", "UNA PERSONA", "EL QUE", "LOS QUE", "LA QUE", "LAS QUE",
    "EL OTRO", "LOS OTROS", "LA OTRA", "ELLOS", "ELLAS", "UN MASCULINO", "UNA FEMENINA",
    "DOS MASCULINOS", "VARIOS MASCULINOS", "TRES MASCULINOS", "CUATRO MASCULINOS",
    "EL CHICO", "LOS CHICOS", "EL TRANZA", "LOS TRANZAS", "UN TRANZA", "LOS TRANSAS", "EL TRANSA",
    "EL LUGAR", "LA CASA", "LA CASILLA", "LA FINCA", "LA PROPIEDAD", "LA POLICIA", "EL MOVIL",
    "EL PATRULLERO", "UN SUJETO", "LOS SUJETOS", "ESTA GENTE", "UN HOMBRE", "UNA MUJER",
    "EL VECINO", "LA VECINA", "EL DUENO", "LA DUENA", "EL HERMANO", "LA HERMANA", "EL HIJO",
    "LA HIJA", "EL MARIDO", "LA PAREJA", "LA MADRE", "EL PADRE", "DESCONOCE", "NO SABE",
    "NO RECUERDA", "SIN DATOS", "DROGA", "DROGAS", "COCAINA", "MARIHUANA", "PACO",
    "UNA MOTO", "UN AUTO", "UNA CASILLA", "ALGUIEN", "NADIE", "CUALQUIERA",
    "UN PIBE", "LOS PIBES", "EL MENOR", "LOS MENORES", "EL GRUPO", "LOS JEFES",
    "EL", "LA", "LOS", "LAS", "DE", "DEL", "DE LOS", "DE LAS", "A LOS", "A LAS", "EN EL", "EN LA",
    "UNO", "UNA", "UN", "OTRO", "OTRA", "ESTE", "ESE", "AQUEL"
}

CUTOFF_WORDS = [
    r'\s+(?:Y\s+(?:A\s+OTRO|EL\s+OTRO|OTRO|OTRA|LA\s+OTRA))\b',
    r'\s+(?:ES\s+|TIENE\s+|VIVE\s+|ANDA\s+|VENDE\s+|ESTA\s+|ESTAN\s+|QUE\s+|CON\s+|FUE\s+|HABIA\s+|HACE\s+|SE\s+|POR\s+|DE\s+|PARA\s+)\b',
    r'\s+(?:LA\s+CUAL|EL\s+CUAL|QUIEN|QUIENES|NO\s+SABE|NO\s+SE|PERO|DICE|REF|REFIERE)\b'
]

def clean_extracted_name(raw):
    s = raw.strip().strip('*"\'_.,;:!?()[]{}')
    s = re.sub(r'^(?:UN\s+TAL\s+ALIAS|UN\s+TAL|UNA\s+TAL|ALIAS\s+EL|ALIAS\s+LA|ALIAS|EL\s+LLAMADO|LA\s+LLAMADA|AL\s+CUAL\s+LE\s+DICEN|LE\s+DICEN)\s+', '', s, flags=re.IGNORECASE)
    s = s.strip().strip('*"\'_.,;:!?')
    for cw in CUTOFF_WORDS:
        s = re.split(cw, s, flags=re.IGNORECASE)[0]
    s = s.strip().strip('*"\'_.,;:!?')
    if len(s) < 3 or len(s) > 28: return []
    s_upper = s.upper()
    if s_upper in STOPWORDS_BLACKLIST: return []
    if " Y " in s_upper or " E " in s_upper:
        parts = re.split(r'\s+[YE]\s+', s, flags=re.IGNORECASE)
        res = []
        for p in parts: res.extend(clean_extracted_name(p))
        return res
    clean_name = s.title()
    if clean_name.upper() in STOPWORDS_BLACKLIST: return []
    return [clean_name]

def extract_smart_aliases(text):
    patterns = [
        r'(?:ALIAS|APODADO|APODADA|CONOCIDO COMO|CONOCIDA COMO|LE DICEN|LE APODAN)\s+[:\-\*"\'\u201c]?\s*([^\,\.\;\_\(\)\n]+)',
        r'(?:SE LLAMA|DE NOMBRE|NOMBRE DE)\s+[:\-\*"\'\u201c]?\s*([^\,\.\;\_\(\)\n]+)',
        r'APODO\s*[:\-\*"\'\u201c]?\s*([A-Za-z\u00c0-\u024f0-9\s]{2,20})'
    ]
    results = []
    for pat in patterns:
        matches = re.findall(pat, str(text), re.IGNORECASE)
        for m in matches:
            for c in clean_extracted_name(m):
                if c and c not in results: results.append(c)
    return results

def fix_coord(val, coord_type='lat'):
    if pd.isnull(val): return np.nan
    try:
        f = float(val)
        if f == 0: return np.nan
        while abs(f) > 100: f /= 10.0
        if coord_type == 'lat':
            if -34.60 <= f <= -34.40: return f
        else:
            if -58.80 <= f <= -58.60: return f
        return np.nan
    except: return np.nan

def extract_sustancias(text):
    text_u = str(text).upper()
    sustancias = []
    if 'COCAIN' in text_u or 'MERCA' in text_u or 'BLANCA' in text_u: sustancias.append('COCAÍNA')
    if 'PACO' in text_u or 'PASTA BASE' in text_u: sustancias.append('PACO')
    if 'MARIHUAN' in text_u or 'FASO' in text_u or 'FLORES' in text_u or 'HIERBA' in text_u or 'PORRO' in text_u: sustancias.append('MARIHUANA')
    if 'PASTILLA' in text_u or 'EXTASIS' in text_u or 'ACIDO' in text_u: sustancias.append('SINTÉTICAS / PASTILLAS')
    return ' / '.join(sustancias) if sustancias else 'NO ESPECIFICADA / POLIRUBRO'

def check_armas(text):
    text_u = str(text).upper()
    return any(kw in text_u for kw in ['ARMA','TIRO','DISPAR','PISTOL','REVOLVER','ESCOPET','CALIBRE','BALA','BALACERA','9MM'])

def extract_tipo_lugar(text, comment=''):
    combined = (str(text) + ' ' + str(comment)).upper()
    if 'BUNKER' in combined or 'BÚNKER' in combined or 'CASILLA' in combined or 'CHAPA' in combined or 'BALDIO' in combined or 'BALDÍO' in combined: return 'Búnker / Casilla / Baldío'
    if 'VENTANITA' in combined or 'VENTANA' in combined or 'KIOSCO' in combined or 'QUIOSCO' in combined: return 'Ventanita / Kiosco'
    if 'PASILLO' in combined: return 'Pasillo de Asentamiento'
    if 'ESQUINA' in combined or 'VIA PUBLICA' in combined or 'VÍA PÚBLICA' in combined or 'VEREDA' in combined: return 'Vía Pública / Esquina'
    if 'CASA' in combined or 'FINCA' in combined or 'PROPIEDAD' in combined or 'DEPARTAMENTO' in combined: return 'Finca / Vivienda'
    return 'Lugar No Especificado'

def extract_barrio(comment, addr=''):
    combined = (str(comment) + ' ' + str(addr)).upper()
    barrios = [
        'GRAND BOURG', 'PABLO NOGUES', 'NOGUES', 'LOS POLVORINES', 'POLVORINES',
        'TORTUGUITAS', 'VILLA DE MAYO', 'MAYO', 'SOURDEAUX', 'ADOLFO SOURDEAUX',
        'BARRIO EL SOL', 'EL SOL', 'LOMA VERDE', 'BARRIO LAS CASITAS', 'LAS CASITAS',
        'PALERMO', 'SANTA ROSA', 'SAN BLAS', 'BARRIO INFICO', 'INFICO',
        'BARRIO UNION', 'LA CAVA', 'EL RINCON'
    ]
    for b in barrios:
        if b in combined: return b.title()
    return 'Malvinas Argentinas (General)'

def get_franja(h):
    if 0 <= h < 6: return 'Madrugada (00-06 hs)'
    elif 6 <= h < 12: return 'Mañana (06-12 hs)'
    elif 12 <= h < 18: return 'Tarde (12-18 hs)'
    else: return 'Noche (18-24 hs)'

def norm_street(s):
    if not s or pd.isnull(s): return ''
    s = str(s).strip().upper()
    s = re.sub(r'^(?:AV\.?|AVDA\.?|CALLE|PASAJE|PJE\.?|DIAGONAL|BV\.?|BOULEVARD|RUTA)\s+', '', s)
    s = re.sub(r'^(?:PRES\.?|PRESIDENTE|GRAL\.?|GENERAL|TNTE\.?|TENIENTE|DR\.?|DOCTOR|ING\.?|INGENIERO)\s+', '', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

print('--- INICIANDO ETL DROGAS MALVINAS ARGENTINAS ---')

files = [
    ('DROGAS ILICITAS MALVINAS.xlsx', 'DROGAS_ILICITAS_FORMAL', 'Despacho Formal Drogas 911 Malvinas'),
    ('INFORMACION MALVINAS.xlsx', 'INFORMACION_VECINAL_KEYWORDS', 'Alerta Vecinal por Relato (Malvinas)')
]

dfs = []
for fname, orig_code, orig_label in files:
    fpath = os.path.join(INPUT_DIR, fname)
    if os.path.exists(fpath):
        print(f'Cargando {fname}...')
        df = pd.read_excel(fpath)
        df['Origen_Dataset'] = orig_code
        df['Origen_Label'] = orig_label
        dfs.append(df)

df_raw = pd.concat(dfs, ignore_index=True)
df_clean = df_raw.drop_duplicates(subset=['ID']).copy()
print(f'Registros unicos: {len(df_clean)}')

df_clean['Fecha_DT'] = pd.to_datetime(df_clean['Fecha'], errors='coerce')
df_clean['Fecha'] = df_clean['Fecha_DT'].dt.strftime('%Y-%m-%d %H:%M')
df_clean['Hora'] = df_clean['Fecha_DT'].dt.hour
df_clean['Dia_Semana'] = df_clean['Fecha_DT'].dt.day_name().map({
    'Monday': 'Lunes', 'Tuesday': 'Martes', 'Wednesday': 'Miercoles',
    'Thursday': 'Jueves', 'Friday': 'Viernes', 'Saturday': 'Sabado', 'Sunday': 'Domingo'
})
df_clean['Franja_Horaria'] = df_clean['Hora'].apply(lambda h: get_franja(h) if pd.notnull(h) else 'Desconocida')

df_clean['Latitud_Clean'] = df_clean['Latitud'].apply(lambda v: fix_coord(v, 'lat'))
df_clean['Longitud_Clean'] = df_clean['Longitud'].apply(lambda v: fix_coord(v, 'lon'))

geocoded_initial = df_clean[df_clean['Latitud_Clean'].notnull() & df_clean['Longitud_Clean'].notnull()]
street_db = {}
for _, r in geocoded_initial.iterrows():
    c = norm_street(r.get('calle'))
    if c and len(c) > 2:
        if c not in street_db: street_db[c] = []
        street_db[c].append((r['Latitud_Clean'], r['Longitud_Clean']))
street_centroids = {k: (sum(p[0] for p in v)/len(v), sum(p[1] for p in v)/len(v)) for k, v in street_db.items()}

extra_streets = {
    'RUTA 8': (-34.491, -58.697), 'RUTA 197': (-34.503, -58.712), 'HIPOLITO YRIGOYEN': (-34.503, -58.712),
    'PERITO MORENO': (-34.507, -58.719), 'SAN MARTIN': (-34.481, -58.719),
    'JOSE HERNANDEZ': (-34.504, -58.738), 'BOUCHARD': (-34.504, -58.738),
    'HIPOLITO BOUCHARD': (-34.504, -58.738), 'ALMIRANTE BROWN': (-34.504, -58.738),
    'ALTE BROWN': (-34.504, -58.738), 'BELGRANO': (-34.490, -58.705),
    'PASTEUR': (-34.485, -58.745), 'MIRAFLORES': (-34.477, -58.725),
    'ESTEBAN GOMEZ': (-34.477, -58.725), 'ALFONSINA STORNI': (-34.481, -58.735),
    'MORSE': (-34.481, -58.735), 'CANGALLO': (-34.507, -58.748),
    'BOYLE': (-34.507, -58.748), 'FLORIDA': (-34.485, -58.745),
    'MARIANO PI': (-34.483, -58.740), 'BENJAMIN SEAVER': (-34.499, -58.720),
    'MONSERRAT': (-34.499, -58.720), 'OTTO KRAUSSE': (-34.476, -58.728),
    'VENTURA COOL': (-34.491, -58.697), 'JUAN PABLO DUARTE': (-34.494, -58.715),
    'CARACAS': (-34.494, -58.715), 'PILAR': (-34.479, -58.695),
    'LAPRIDA': (-34.508, -58.726), 'COLOMBIA': (-34.512, -58.730),
    'COLON': (-34.483, -58.716), 'CORRIENTES': (-34.489, -58.708),
    'SARMIENTO': (-34.494, -58.714), 'MITRE': (-34.488, -58.706),
    'RIVADAVIA': (-34.496, -58.718), 'URQUIZA': (-34.499, -58.722),
    'AVELLANEDA': (-34.501, -58.724), 'MAIPU': (-34.487, -58.700),
    'TUCUMAN': (-34.493, -58.712), 'MENDOZA': (-34.497, -58.720),
    'ENTRE RIOS': (-34.500, -58.723), 'SANTA FE': (-34.491, -58.709),
    'CORDOBA': (-34.493, -58.713), 'FORMOSA': (-34.510, -58.729),
    'CATAMARCA': (-34.507, -58.726), 'JUJUY': (-34.505, -58.724),
    'SALTA': (-34.503, -58.722), 'LA RIOJA': (-34.501, -58.720),
    'SAN LUIS': (-34.499, -58.718), 'SAN JUAN': (-34.497, -58.716),
    'NEUQUEN': (-34.495, -58.714), 'RIO NEGRO': (-34.493, -58.712),
    'TIERRA DEL FUEGO': (-34.491, -58.710), 'LIBERTAD': (-34.479, -58.714),
    'INDEPENDENCIA': (-34.483, -58.718), 'REPUBLICA': (-34.487, -58.722),
    'CONSTITUCION': (-34.491, -58.726), 'DEMOCRACIA': (-34.495, -58.730),
    'JUAN DOMINGO PERON': (-34.476, -58.693), 'PERON': (-34.476, -58.693),
    'EJERCITO DE LOS ANDES': (-34.474, -58.700), 'EJERCITO': (-34.474, -58.700),
}
for k, v in extra_streets.items():
    if k not in street_centroids: street_centroids[k] = v

known_barrios = {
    'GRAND BOURG': (-34.481, -58.719), 'PABLO NOGUES': (-34.474, -58.700), 'NOGUES': (-34.474, -58.700),
    'LOS POLVORINES': (-34.507, -58.719), 'POLVORINES': (-34.507, -58.719),
    'TORTUGUITAS': (-34.476, -58.693), 'VILLA DE MAYO': (-34.494, -58.736),
    'MAYO': (-34.494, -58.736), 'SOURDEAUX': (-34.468, -58.710),
    'ADOLFO SOURDEAUX': (-34.468, -58.710), 'LOMA VERDE': (-34.491, -58.697),
    'BARRIO EL SOL': (-34.492, -58.741), 'EL SOL': (-34.492, -58.741),
    'BARRIO LAS CASITAS': (-34.485, -58.745), 'LAS CASITAS': (-34.485, -58.745),
    'LA CAVA': (-34.501, -58.735), 'EL RINCON': (-34.505, -58.742),
    'INFICO': (-34.508, -58.722),
}

recovered_count = 0
precisions = []

for idx, r in df_clean.iterrows():
    if pd.notnull(r['Latitud_Clean']) and pd.notnull(r['Longitud_Clean']):
        precisions.append('EXACTA_DESPACHO')
        continue
    c = norm_street(r.get('calle'))
    cs = norm_street(r.get('calleSuperior'))
    ci = norm_street(r.get('calleInferior'))
    comb = (str(r.get('comentario', '')) + ' ' + str(r.get('Direccion', r.get('Direcci\u00f3n', ''))) + ' ' + str(r.get('Relato', ''))).upper()
    skip_words = {'OTRA', 'OTRO', 'OTRAS', 'INDEFINIDO', '.', '....', ':', 'NAN', 'INDEF'}
    if c in street_centroids and c not in skip_words and cs in street_centroids and cs not in skip_words:
        p1 = street_centroids[c]; p2 = street_centroids[cs]
        df_clean.at[idx, 'Latitud_Clean'] = round((p1[0]+p2[0])/2, 6)
        df_clean.at[idx, 'Longitud_Clean'] = round((p1[1]+p2[1])/2, 6)
        precisions.append('INTERSECCION_ESQUINA'); recovered_count += 1; continue
    if c in street_centroids and c not in skip_words and ci in street_centroids and ci not in skip_words:
        p1 = street_centroids[c]; p2 = street_centroids[ci]
        df_clean.at[idx, 'Latitud_Clean'] = round((p1[0]+p2[0])/2, 6)
        df_clean.at[idx, 'Longitud_Clean'] = round((p1[1]+p2[1])/2, 6)
        precisions.append('INTERSECCION_ESQUINA'); recovered_count += 1; continue
    if c in street_centroids and c not in skip_words:
        p = street_centroids[c]
        df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
        df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
        precisions.append('CENTROIDE_CALLE'); recovered_count += 1; continue
    if cs in street_centroids and cs not in skip_words:
        p = street_centroids[cs]
        df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
        df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
        precisions.append('TRANSVERSAL_ESQUINA'); recovered_count += 1; continue
    if ci in street_centroids and ci not in skip_words:
        p = street_centroids[ci]
        df_clean.at[idx, 'Latitud_Clean'] = round(p[0], 6)
        df_clean.at[idx, 'Longitud_Clean'] = round(p[1], 6)
        precisions.append('TRANSVERSAL_ESQUINA'); recovered_count += 1; continue
    found_barrio = False
    for b_name, b_pt in known_barrios.items():
        if b_name in comb:
            df_clean.at[idx, 'Latitud_Clean'] = round(b_pt[0], 6)
            df_clean.at[idx, 'Longitud_Clean'] = round(b_pt[1], 6)
            precisions.append('CENTROIDE_BARRIO'); recovered_count += 1; found_barrio = True; break
    if found_barrio: continue
    precisions.append('SIN_LOCALIZACION')

df_clean['Precision_Geo'] = precisions
print(f'Geocodificacion: {recovered_count} registros recuperados')

df_clean['Sustancia_Detectada'] = df_clean['Relato'].apply(extract_sustancias)
df_clean['Tiene_Armas'] = df_clean['Relato'].apply(check_armas)
df_clean['Tipo_Punto_Venta'] = df_clean.apply(lambda r: extract_tipo_lugar(r['Relato'], r.get('comentario', '')), axis=1)
df_clean['Alias_Identificados'] = df_clean['Relato'].apply(extract_smart_aliases)
df_clean['Barrio_Detectado'] = df_clean.apply(lambda r: extract_barrio(r.get('comentario', ''), r.get('Direccion', r.get('Direcci\u00f3n', ''))), axis=1)
df_clean['Partido'] = 'MALVINAS ARGENTINAS'

records = []
col_dir = 'Direccion' if 'Direccion' in df_clean.columns else 'Direcci\u00f3n'
for _, r in df_clean.iterrows():
    rec = {
        'id': int(r['ID']) if pd.notnull(r['ID']) else 0,
        'ID': int(r['ID']) if pd.notnull(r['ID']) else 0,
        'fecha': str(r['Fecha']) if pd.notnull(r['Fecha']) else '',
        'Fecha': str(r['Fecha']) if pd.notnull(r['Fecha']) else '',
        'hora': int(r['Hora']) if pd.notnull(r['Hora']) else 12,
        'Hora': int(r['Hora']) if pd.notnull(r['Hora']) else 12,
        'franja': str(r['Franja_Horaria']),
        'Franja_Horaria': str(r['Franja_Horaria']),
        'dia': str(r['Dia_Semana']),
        'Dia_Semana': str(r['Dia_Semana']),
        'direccion': str(r[col_dir]) if pd.notnull(r[col_dir]) else 'Malvinas Argentinas',
        'lat': float(r['Latitud_Clean']) if pd.notnull(r['Latitud_Clean']) else None,
        'lng': float(r['Longitud_Clean']) if pd.notnull(r['Longitud_Clean']) else None,
        'precision_geo': str(r['Precision_Geo']),
        'calle': str(r.get('calle', '')).strip() if pd.notnull(r.get('calle')) else '',
        'calleSuperior': str(r.get('calleSuperior', '')).strip() if pd.notnull(r.get('calleSuperior')) else '',
        'calleInferior': str(r.get('calleInferior', '')).strip() if pd.notnull(r.get('calleInferior')) else '',
        'relato': str(r['Relato']) if pd.notnull(r['Relato']) else '',
        'Relato': str(r['Relato']) if pd.notnull(r['Relato']) else '',
        'comentario': str(r.get('comentario', '')) if pd.notnull(r.get('comentario')) else '',
        'origen': str(r['Origen_Dataset']),
        'Origen_Dataset': str(r['Origen_Dataset']),
        'origenLabel': str(r['Origen_Label']),
        'tipo': 'NARCOCRIMINALIDAD',
        'Tipo': 'NARCOCRIMINALIDAD',
        'subtipo': str(r['Sustancia_Detectada']),
        'SubTipo': str(r['Sustancia_Detectada']),
        'sustancia': str(r['Sustancia_Detectada']),
        'Sustancia': str(r['Sustancia_Detectada']),
        'tieneArmas': bool(r['Tiene_Armas']),
        'Tiene_Armas': bool(r['Tiene_Armas']),
        'tipoLugar': str(r['Tipo_Punto_Venta']),
        'Tipo_Punto_Venta': str(r['Tipo_Punto_Venta']),
        'alias': r['Alias_Identificados'],
        'Alias_Identificados': r['Alias_Identificados'],
        'barrio': str(r['Barrio_Detectado']),
        'Barrio_Detectado': str(r['Barrio_Detectado']),
        'partido': 'MALVINAS ARGENTINAS',
        'localidad': str(r.get('Localidad asignada', '')) if pd.notnull(r.get('Localidad asignada')) else '',
    }
    records.append(rec)

csv_out = os.path.join(OUTPUT_DIR, 'malvinas_drogas_consolidado.csv')
json_out = os.path.join(OUTPUT_DIR, 'malvinas_drogas_consolidado.json')
df_clean.to_csv(csv_out, index=False, encoding='utf-8')
with open(json_out, 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
with open(os.path.join(PUBLIC_OUTPUT_DIR, 'malvinas_drogas_consolidado.json'), 'w', encoding='utf-8') as f:
    json.dump(records, f, ensure_ascii=False, indent=2)
df_clean.to_csv(os.path.join(PUBLIC_OUTPUT_DIR, 'malvinas_drogas_consolidado.csv'), index=False, encoding='utf-8')

geo_total = sum(1 for r in records if r['lat'] is not None and r['lng'] is not None)
print(f'[EXITO] {len(records)} registros guardados. Geo: {geo_total}/{len(records)} ({geo_total/len(records)*100:.1f}%)')
