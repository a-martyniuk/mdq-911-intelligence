# Diccionario de Datos: Proyecto Mar del Plata 911

> [!NOTE]
> Este diccionario describe la totalidad de las variables contenidas en el dataset consolidado (`mdp_incidentes_consolidado.csv` / `.parquet`), así como las variables derivadas producidas por el pipeline ETL de datos.

---

## 📋 1. Variables Originales del Sistema 911

| Campo | Tipo de Dato | Descripción | Ejemplo de Valor |
| :--- | :--- | :--- | :--- |
| **`ID`** | Entero (`int64`) | Identificador único de llamada / despacho registrado por la central del 911. | `10016459521` |
| **`Fecha`** | Timestamp (`datetime64`) | Fecha y hora exacta de recepción de la llamada de emergencia (precisión al minuto). | `2026-08-05 23:31:00` |
| **`Dirección`** | Texto (`string`) | Esquina, calle o altura informada durante la llamada o por despacho policial. | `BALCARCE y España` |
| **`Tipo`** | Texto (`string`) | Categoría primaria del incidente delictivo o de emergencia según la taxonomía 911. | `ROBO AUTOMOTOR`, `DISPAROS`, `VIOLENCIA`, `HALLAZGO` |
| **`SubTipo`** | Texto (`string`) | Clasificación secundaria específica del incidente. | `MOTOS`, `VEHÍCULOS`, `PERSONAS`, `NO FAMILIAR` |
| **`Relato`** | Texto libre (`string`) | Transcripción de la llamada telefónica en tiempo real y notas operativas digitadas por el operador. | `LLAMANTE REFIERE QUE LE ROBARON LA MOTO...` |
| **`Partido asignado`** | Texto (`string`) | Municipio de jurisdicción policial asignado al incidente. | `GENERAL PUEYRREDON` |
| **`Localidad asignada`** | Texto (`string`) | Ciudad o localidad asignada en el mapeo del despacho. | `MAR DEL PLATA`, `BATAN` *(o Nulo en áreas periurbanas)* |
| **`Resultado` / `RESULTADO`** | Texto (`string`) | Código de cierre otorgado al finalizar la intervención policial. | `POSITIVO`, `NEGATIVO`, `V ACC-MC`, `JTv` |
| **`Comentario Cierre Supervisor`** | Texto (`string`) | Nota aclaratoria ingresada por el supervisor de despacho al cerrar la novedad. | `POSITIVO DATOS EN RELATO` |

---

## 🛠️ 2. Variables Limpias y Derivadas (Enriquecimiento ETL)

| Campo | Tipo de Dato | Descripción | Método de Extracción / Cálculo |
| :--- | :--- | :--- | :--- |
| **`Latitud_Clean`** | Float (`float64`) | Latitud geográfica corregida en grados decimales (Rango: -38.25 a -37.75). | Reajuste decimal mediante regex para corregir desfasaje de exportación Excel. |
| **`Longitud_Clean`** | Float (`float64`) | Longitud geográfica corregida en grados decimales (Rango: -57.75 a -57.35). | Reajuste decimal mediante regex para corregir desfasaje de exportación Excel. |
| **`Año`** | Entero (`int64`) | Año de ocurrencia del incidente. | Extraído desde `Fecha` (`2026`). |
| **`Mes`** | Entero (`int64`) | Número ordinal del mes (1 al 12). | Extraído desde `Fecha` (`1` a `8`). |
| **`Mes_Nombre`** | Texto (`string`) | Nombre completo del mes. | `January` a `August`. |
| **`Dia`** | Entero (`int64`) | Día del mes (1 a 31). | Extraído desde `Fecha`. |
| **`Hora`** | Entero (`int64`) | Hora del día en formato 24 hs (0 a 23). | Extraído desde `Fecha`. |
| **`Dia_Semana`** | Texto (`string`) | Nombre en español del día de la semana. | `Lunes`, `Martes`, ..., `Domingo`. |
| **`Dia_Semana_Num`** | Entero (`int64`) | Índice del día de la semana (0 = Lunes, 6 = Domingo). | Mapeo cronológico estándar. |
| **`Es_FinDeSemana`** | Booleano (`bool`) | Indica si el evento ocurrió durante el fin de semana. | `True` si es Sábado o Domingo, `False` si es día laboral. |
| **`Franja_Horaria`** | Texto (`string`) | Bloque horario del día para agrupamiento táctico. | `Madrugada (00-06)`, `Mañana (06-12)`, `Tarde (12-18)`, `Noche (18-24)`. |
| **`Patentes_Extraidas`** | Lista / Texto | Lista de dominio/s vehiculares detectados en el texto `Relato`. | Expresión Regular para formato Mercosur y Patentes Argentinas tradicionales. |
| **`Patente_Principal`** | Texto (`string`) | Dominio principal extraído del vehículo involucrado. | Primera patente hallada en `Relato` (ej. `A115NAU`, `NGI943`). |
| **`Marca_Detectada`** | Texto (`string`) | Marca comercial del vehículo identificada en el relato. | Búsqueda por diccionario de marcas (`ZANELLA`, `GILERA`, `CHEVROLET`, `FORD`, etc.). |
| **`Origen_Dataset`** | Texto (`string`) | Identificador del dataset fuente de procedencia. | `ROBO_AUTO_MOTO`, `HALLAZGO_AUTOMOTOR`, `DISPAROS_PERSONAS`, `ARMA_FUEGO`. |

---

## 🚘 3. Variables de Recuperación Vehicular (`mdp_vehiculos_recuperados.csv`)

| Campo | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| **`Patente_Principal`** | Texto (`string`) | Dominio vehicular coincidente entre el registro de Robo y de Hallazgo. |
| **`Fecha_Robo`** | Timestamp (`datetime64`) | Fecha y hora en que se registró el robo del vehículo en el 911. |
| **`Fecha_Hallazgo`** | Timestamp (`datetime64`) | Fecha y hora en que se registró el hallazgo o abandono del vehículo. |
| **`Horas_Hasta_Hallazgo`** | Float (`float64`) | Horas transcurridas desde el robo hasta el hallazgo. |
| **`Dias_Hasta_Hallazgo`** | Float (`float64`) | Días transcurridos desde el robo hasta el hallazgo (`Horas / 24.0`). |
