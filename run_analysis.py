import os
import sys
import pandas as pd

# Agregar src al PATH
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from etl_cleaner import run_etl
from spatiotemporal_analysis import run_spatiotemporal_analysis

def main():
    print("\n========================================================")
    print("   PROYECTO DATOS MAR DEL PLATA - PIPELINE DE ANÁLISIS")
    print("========================================================\n")
    
    # 1. Ejecutar ETL
    df_cons = run_etl()
    
    # 2. Ejecutar Análisis Espacio-Temporal
    run_spatiotemporal_analysis()
    
    # 3. Generar Resumen Estadístico
    rec_file = r"D:\Projects\Datos de Mar del Plata\data\processed\mdp_vehiculos_recuperados.csv"
    df_rec = pd.read_csv(rec_file) if os.path.exists(rec_file) else pd.DataFrame()
    
    resumen_text = f"""======================================================
RESUMEN EJECUTIVO DEL ANÁLISIS DE DATOS - MAR DEL PLATA
======================================================
Periodo Analizado: Enero 2026 - Agosto 2026
Total Incidentes 911 Procesados: {len(df_cons):,}

1. DISTRIBUCIÓN POR ARCHIVO/ORIGEN:
{df_cons['Origen_Dataset'].value_counts().to_string()}

2. CALIDAD DE GEORREFERENCIACIÓN:
- Coordenadas geográficas válidas procesadas: {df_cons['Latitud_Clean'].notnull().sum():,} ({df_cons['Latitud_Clean'].notnull().sum()/len(df_cons)*100:.1f}%)

3. HALLAZGOS TEMPORALES CLAVE:
- Franja horaria con mayor actividad delictiva general: {df_cons['Franja_Horaria'].value_counts().idxmax()} ({df_cons['Franja_Horaria'].value_counts().max():,} casos)
- Día de la semana con mayor concentración de incidentes: {df_cons['Dia_Semana'].value_counts().idxmax()} ({df_cons['Dia_Semana'].value_counts().max():,} casos)

4. VEHÍCULOS ROBADOS Y RECUPERADOS (NLP EN RELATO):
- Patentes identificadas mediante regex NLP en robos: {df_cons[df_cons['Origen_Dataset']=='ROBO_AUTO_MOTO']['Patente_Principal'].notnull().sum():,}
- Vehículos Robados con Hallazgo confirmado por patente: {len(df_rec):,}
- Tiempo Mediano de Recuperación: {df_rec['Dias_Hasta_Hallazgo'].median():.1f} días ({df_rec['Horas_Hasta_Hallazgo'].median():.1f} horas)
- Tiempo Promedio de Recuperación: {df_rec['Dias_Hasta_Hallazgo'].mean():.1f} días ({df_rec['Horas_Hasta_Hallazgo'].mean():.1f} horas)

ARCHIVOS PROCESADOS GENERADOS:
- CSV Consolidado: D:\\Projects\\Datos de Mar del Plata\\data\\processed\\mdp_incidentes_consolidado.csv
- Parquet Consolidado: D:\\Projects\\Datos de Mar del Plata\\data\\processed\\mdp_incidentes_consolidado.parquet
- Vehículos Recuperados: D:\\Projects\\Datos de Mar del Plata\\data\\processed\\mdp_vehiculos_recuperados.csv
- Gráficos y Mapas: D:\\Projects\\Datos de Mar del Plata\\reports\\figures\\
======================================================
"""
    
    report_file = r"D:\Projects\Datos de Mar del Plata\reports\resumen_ejecutivo.txt"
    os.makedirs(os.path.dirname(report_file), exist_ok=True)
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(resumen_text)
        
    print(resumen_text)

if __name__ == "__main__":
    main()
