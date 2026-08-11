import os
import math
import urllib.request
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
from PIL import Image

BASE_DIR = r"D:\Projects\Datos de Mar del Plata"
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)

# ----------------------------------------------------
# GENERADOR DE MAPA BASE CARTODB / OPENSTREETMAP
# ----------------------------------------------------
def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def num2deg(xtile, ytile, zoom):
    n = 2.0 ** zoom
    lon_deg = xtile / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(math.pi * (1 - 2 * ytile / n)))
    lat_deg = math.degrees(lat_rad)
    return (lat_deg, lon_deg)

def get_osm_tile(x, y, z):
    cache_dir = os.path.join(REPORTS_DIR, ".tile_cache")
    os.makedirs(cache_dir, exist_ok=True)
    file_path = os.path.join(cache_dir, f"tile_{z}_{x}_{y}.png")
    
    if os.path.exists(file_path):
        try:
            return Image.open(file_path)
        except Exception:
            pass
            
    url = f"https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = resp.read()
            with open(file_path, 'wb') as f:
                f.write(data)
            return Image.open(file_path)
    except Exception as e:
        print(f"Advertencia: No se pudo descargar tile {z}/{x}/{y} ({e})")
        return None

def fetch_basemap(min_lat, max_lat, min_lon, max_lon, zoom=12):
    """Descarga e integra un mosaico de mapa urbano de CartoDB/OSM."""
    x_min, y_max = deg2num(min_lat, min_lon, zoom)
    x_max, y_min = deg2num(max_lat, max_lon, zoom)
    
    width = (x_max - x_min + 1) * 256
    height = (y_max - y_min + 1) * 256
    merged_image = Image.new('RGB', (width, height), (240, 240, 240))
    
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            tile = get_osm_tile(x, y, zoom)
            if tile:
                px_pos = (x - x_min) * 256
                py_pos = (y - y_min) * 256
                merged_image.paste(tile, (px_pos, py_pos))
                
    nw_lat, nw_lon = num2deg(x_min, y_min, zoom)
    se_lat, se_lon = num2deg(x_max + 1, y_max + 1, zoom)
    
    extent = [nw_lon, se_lon, se_lat, nw_lat]
    return merged_image, extent

def run_spatiotemporal_analysis():
    print("==========================================")
    print("   INICIANDO ANÁLISIS ESPACIO-TEMPORAL")
    print("==========================================")
    
    cons_file = os.path.join(PROCESSED_DIR, "mdp_incidentes_consolidado.csv")
    rec_file = os.path.join(PROCESSED_DIR, "mdp_vehiculos_recuperados.csv")
    
    if not os.path.exists(cons_file):
        raise FileNotFoundError(f"No se encontró {cons_file}. Ejecute etl_cleaner.py primero.")
        
    df = pd.read_csv(cons_file)
    df_rec = pd.read_csv(rec_file) if os.path.exists(rec_file) else pd.DataFrame()
    
    print(f"Total registros cargados para análisis: {len(df)}")
    
    # ----------------------------------------------------
    # 1. ANÁLISIS TEMPORAL
    # ----------------------------------------------------
    print("\n[1/3] Generando gráficos temporales...")
    
    # A. Incidencia por Hora del Día
    fig, ax = plt.subplots(figsize=(12, 6))
    df_hora = df.groupby(['Hora', 'Origen_Dataset']).size().unstack(fill_value=0)
    df_hora.plot(kind='bar', stacked=True, ax=ax, colormap='Set2')
    ax.set_title("Distribución de Incidentes por Hora del Día (00-23 hs) en Mar del Plata", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel("Hora del Día", fontsize=12)
    ax.set_ylabel("Cantidad de Incidentes", fontsize=12)
    ax.legend(title="Origen Dataset", frameon=True)
    plt.xticks(rotation=0)
    plt.tight_layout()
    plot_hora_path = os.path.join(FIGURES_DIR, "01_incidentes_por_hora.png")
    plt.savefig(plot_hora_path, dpi=300)
    plt.close()
    print(f"   [Guardado]: {plot_hora_path}")
    
    # B. Matriz de Calor: Día de la Semana vs Hora del Día
    dias_orden = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    heatmap_data = pd.crosstab(df['Dia_Semana'], df['Hora']).reindex(dias_orden).fillna(0)
    
    fig, ax = plt.subplots(figsize=(14, 7))
    sns.heatmap(heatmap_data, cmap='YlOrRd', annot=True, fmt='g', linewidths=.5, ax=ax)
    ax.set_title("Matriz de Calor: Día de la Semana vs Hora del Día (Total Incidentes 911)", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel("Hora del Día", fontsize=12)
    ax.set_ylabel("Día de la Semana", fontsize=12)
    plt.tight_layout()
    plot_hm_path = os.path.join(FIGURES_DIR, "02_matriz_calor_dia_hora.png")
    plt.savefig(plot_hm_path, dpi=300)
    plt.close()
    print(f"   [Guardado]: {plot_hm_path}")
    
    # C. Evolución Mensual
    df['Mes_Año'] = pd.to_datetime(df['Fecha']).dt.strftime('%Y-%m')
    fig, ax = plt.subplots(figsize=(10, 5))
    df_mes = df.groupby(['Mes_Año', 'Origen_Dataset']).size().unstack(fill_value=0)
    df_mes.plot(kind='line', marker='o', linewidth=2.5, ax=ax)
    ax.set_title("Evolución Mensual de Incidentes por Categoría (Ene - Ago 2026)", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel("Mes", fontsize=12)
    ax.set_ylabel("Cantidad de Incidentes", fontsize=12)
    ax.grid(True, linestyle='--', alpha=0.7)
    plt.tight_layout()
    plot_mes_path = os.path.join(FIGURES_DIR, "03_evolucion_mensual.png")
    plt.savefig(plot_mes_path, dpi=300)
    plt.close()
    print(f"   [Guardado]: {plot_mes_path}")
    
    # ----------------------------------------------------
    # 2. ANÁLISIS ESPACIAL (MAPAS INTERACTIVOS Y CON MAPA DE FONDO)
    # ----------------------------------------------------
    print("\n[2/3] Generando mapas espacio-temporales...")
    
    df_geo = df[df['Latitud_Clean'].notnull() & df['Longitud_Clean'].notnull()].copy()
    print(f"   Registros georreferenciados válidos: {len(df_geo)} ({len(df_geo)/len(df)*100:.1f}%)")
    
    # Obtención de Mapa Base Callejero de CartoDB / OpenStreetMap
    min_lat, max_lat = -38.15, -37.88
    min_lon, max_lon = -57.70, -57.48
    basemap_img, extent = fetch_basemap(min_lat, max_lat, min_lon, max_lon, zoom=12)
    
    # A. Mapa de Dispersión Interactivo en Plotly (HTML)
    fig_px = px.scatter_mapbox(
        df_geo,
        lat="Latitud_Clean",
        lon="Longitud_Clean",
        color="Origen_Dataset",
        hover_name="SubTipo",
        hover_data=["Dirección", "Fecha", "Marca_Detectada"],
        zoom=12,
        center={"lat": -38.00, "lon": -57.56},
        mapbox_style="open-street-map",
        title="Mapa Interactivo de Incidentes 911 - Mar del Plata",
        height=750
    )
    plot_map_html = os.path.join(FIGURES_DIR, "04_mapa_interactivo_incidentes.html")
    fig_px.write_html(plot_map_html)
    print(f"   [Guardado HTML]: {plot_map_html}")
    
    # B. Mapa de Densidad Espacial General / Hotspots (Plotly HTML - Des-saturado)
    fig_density = px.density_mapbox(
        df_geo,
        lat="Latitud_Clean",
        lon="Longitud_Clean",
        radius=5,
        center={"lat": -38.00, "lon": -57.56},
        zoom=12,
        mapbox_style="open-street-map",
        color_continuous_scale="Plasma",
        opacity=0.65,
        title="Mapa de Densidad (Hotspots) General de Incidentes 911 - Mar del Plata",
        height=750
    )
    plot_density_html = os.path.join(FIGURES_DIR, "05_mapa_hotspots_densidad.html")
    fig_density.write_html(plot_density_html)
    print(f"   [Guardado HTML]: {plot_density_html}")
    
    # C. Mapa de Densidad Estático PNG CON MAPA DE FONDO CALLEJERO (05_mapa_hotspots_densidad.png)
    fig, ax = plt.subplots(figsize=(12, 12))
    ax.imshow(basemap_img, extent=extent, aspect='equal')
    
    sns.kdeplot(
        data=df_geo,
        x="Longitud_Clean",
        y="Latitud_Clean",
        fill=True,
        cmap="YlOrRd",
        thresh=0.08,
        levels=15,
        alpha=0.55,
        ax=ax
    )
    ax.set_xlim(min_lon, max_lon)
    ax.set_ylim(min_lat, max_lat)
    ax.set_title("Hotspots de Densidad Delictiva con Mapa de Fondo Callejero - Mar del Plata", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel("Longitud", fontsize=12)
    ax.set_ylabel("Latitud", fontsize=12)
    plt.tight_layout()
    plot_kde_png = os.path.join(FIGURES_DIR, "05_mapa_hotspots_densidad.png")
    plt.savefig(plot_kde_png, dpi=300)
    plt.close()
    print(f"   [Guardado PNG con Mapa Base]: {plot_kde_png}")

    # D. Distribución Geográfica de Puntos CON MAPA DE FONDO CALLEJERO (06_distribucion_geografica.png)
    fig, ax = plt.subplots(figsize=(12, 12))
    ax.imshow(basemap_img, extent=extent, aspect='equal')
    
    sns.scatterplot(
        data=df_geo,
        x='Longitud_Clean',
        y='Latitud_Clean',
        hue='Origen_Dataset',
        alpha=0.7,
        s=30,
        edgecolor='black',
        linewidth=0.2,
        ax=ax
    )
    ax.set_xlim(min_lon, max_lon)
    ax.set_ylim(min_lat, max_lat)
    ax.set_title("Distribución Geográfica de Incidentes 911 sobre Mapa Callejero", fontsize=14, fontweight='bold', pad=15)
    ax.set_xlabel("Longitud", fontsize=12)
    ax.set_ylabel("Latitud", fontsize=12)
    ax.legend(title="Origen Dataset", loc='upper left', frameon=True, facecolor='white', framealpha=0.9)
    plt.tight_layout()
    plot_geo_png = os.path.join(FIGURES_DIR, "06_distribucion_geografica.png")
    plt.savefig(plot_geo_png, dpi=300)
    plt.close()
    print(f"   [Guardado PNG con Mapa Base]: {plot_geo_png}")

    # ----------------------------------------------------
    # 3. ANÁLISIS DE VEHÍCULOS RECUPERADOS
    # ----------------------------------------------------
    print("\n[3/3] Generando métricas de recuperación vehicular...")
    if not df_rec.empty:
        fig, ax = plt.subplots(figsize=(10, 5))
        sns.histplot(df_rec['Dias_Hasta_Hallazgo'].clip(upper=30), bins=30, kde=True, color='teal', ax=ax)
        ax.set_title("Distribución del Tiempo Transcurrido entre Robo y Hallazgo (Días)", fontsize=14, fontweight='bold', pad=15)
        ax.set_xlabel("Días hasta el Hallazgo", fontsize=12)
        ax.set_ylabel("Cantidad de Vehículos", fontsize=12)
        
        median_days = df_rec['Dias_Hasta_Hallazgo'].median()
        mean_days = df_rec['Dias_Hasta_Hallazgo'].mean()
        
        ax.axvline(median_days, color='red', linestyle='--', label=f'Mediana: {median_days:.1f} días')
        ax.axvline(mean_days, color='orange', linestyle=':', label=f'Promedio: {mean_days:.1f} días')
        ax.legend()
        plt.tight_layout()
        plot_rec_png = os.path.join(FIGURES_DIR, "07_tiempo_recuperacion_vehiculos.png")
        plt.savefig(plot_rec_png, dpi=300)
        plt.close()
        print(f"   [Guardado PNG]: {plot_rec_png}")

    print("==========================================")
    print("   ANÁLISIS ESPACIO-TEMPORAL COMPLETADO")
    print("==========================================\n")

if __name__ == "__main__":
    run_spatiotemporal_analysis()
