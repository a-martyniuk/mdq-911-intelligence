# MDQ 911 Intelligence Platform — Mar del Plata

> **Data Engineering, NLP y Geospatial Analytics aplicados al análisis de incidentes urbanos del Partido de General Pueyrredón.**

Aplicación web profesional e interactiva desarrollada con **Next.js 16, React 19, TypeScript, Python (Pandas/Parquet/RegEx NLP), Leaflet.js y Plotly.js**, diseñada como proyecto destacado de portfolio profesional (`https://www.alexismartyniuk.com.ar/mdq-911-intelligence`).

---

## 🎯 1. Objetivo del Proyecto

Transformar 8.598 registros de emergencias e incidentes del 911 (Enero – Agosto 2026) en una plataforma web interactiva de Inteligencia de Datos que permite explorar:
- **Resumen Ejecutivo**: KPIs consolidados de criminalidad y recuperación vehicular.
- **Distribución Geográfica**: Mapa interactivo con clustering y filtros dinámicos.
- **Hotspots Delictivos**: Estimación Kernel Density Estimation (KDE) des-saturada sobre mapa base urbano.
- **Análisis Temporal**: Identificación del pico nocturno (18:00–24:00 hs con el 39.5% de casos) y picos de fin de semana.
- **Vehículos Robados y Hallados**: Matching relacional por patente extraída de relatos con mediana de recuperación de 5.4 hs.
- **Procesamiento NLP**: Extracción automatizada RegEx de patentes argentinas y marcas comerciales en relatos no estructurados.
- **Data Engineering / ETL**: Pipeline de 10 etapas con corrección decimal de georreferenciación y exportación Parquet/CSV.
- **Diccionario de Datos**: Matriz navegable y buscable con especificación de 28 variables originales y derivadas.

---

## 🔒 2. Autenticación y Seguridad

La aplicación cuenta con **autenticación obligatoria del lado servidor**:
- Hash de contraseñas con **`bcrypt`**.
- Cookies de sesión **`HTTPOnly`**, `SameSite: Lax` y `Secure`.
- Redirección automática a la pantalla de Login `/login` para usuarios no autenticados.
- Protección de endpoints de datos `/api/data/incidents` para prevenir descargas directas no autorizadas.
- Configuración mediante variables de entorno en `.env` (con plantilla `.env.example`).
- Metatags `noindex, nofollow` para evitar la indexación en motores de búsqueda.

---

## 🚀 3. Instrucción de Ejecución Local

### Prerrequisitos
- **Node.js**: v20.0.0 o superior (recomendado v24+)
- **Python**: v3.10 o superior (con `pandas`, `numpy`, `openpyxl`, `pyarrow`)

### 1. Clonar / Ubicarse en el proyecto
```bash
cd "D:\Projects\Datos de Mar del Plata"
```

### 2. Configurar Variables de Entorno
Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```
Credenciales predeterminadas para desarrollo:
- **Usuario**: `admin`
- **Contraseña**: `admin123` *(Hash bcrypt configurado en `.env`)*

### 3. Instalar dependencias
```bash
npm install
```

### 4. Iniciar servidor de desarrollo Next.js
```bash
npm run dev
```
Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🛠️ 4. Arquitectura y Tecnologías

```text
D:\Projects\Datos de Mar del Plata\
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # Endpoints de Login, Logout y Sesión (bcrypt)
│   │   │   ├── data/           # Endpoint seguro de datasets procesados
│   │   │   └── raw_html/       # Servidor seguro de mapas interactivos HTML
│   │   ├── globals.css         # Sistema de diseño completo (tokens oscuros, glassmorphism)
│   │   ├── layout.tsx          # Root Layout con noindex
│   │   ├── login/              # Pantalla de Login segura
│   │   └── page.tsx            # Página principal Dashboard
│   ├── components/             # Componentes modulares React
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MetricCard.tsx
│   │   ├── SectionMap.tsx
│   │   ├── SectionHotspots.tsx
│   │   ├── SectionTemporal.tsx
│   │   ├── SectionVehicles.tsx
│   │   ├── SectionNLP.tsx
│   │   ├── SectionETL.tsx
│   │   ├── SectionQuality.tsx
│   │   ├── SectionDictionary.tsx
│   │   ├── SectionMethodology.tsx
│   │   └── SectionPrivacy.tsx
│   ├── lib/
│   │   ├── auth.ts             # Lógica de verificación bcrypt y cookies HTTPOnly
│   │   └── types.ts            # Interfaces TypeScript
│   ├── etl_cleaner.py          # Pipeline ETL original en Python
│   └── spatiotemporal_analysis.py # Generador de análisis y mapas de calor
├── data/processed/             # Datasets CSV y Parquet procesados
├── reports/                    # Figuras y resumen ejecutivo
├── .env.example                # Plantilla de entorno
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## 🛡️ 5. Disclaimer / Protección de Datos
Este proyecto fue desarrollado con fines educativos y de demostración de arquitectura de Data Engineering. Todos los relatos e incidentes presentados han sido sanitizados y anonimizados.
