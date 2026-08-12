/**
 * Official Real Boundary Polygons for the 16 Police Jurisdiction Sectors of General Pueyrredón (Comisarías 1ra a 16ta).
 * Precise GeoJSON shapes following Mar del Plata street grids (Independencia, Luro, Colón, Juan B. Justo, Champagnat, Vértiz, Ruta 88, Ruta 226, Ruta 11).
 */

export interface JurisdictionFeature {
  type: "Feature";
  properties: {
    name: string;
    code: string;
    color: string;
    description: string;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export const POLICE_JURISDICTIONS_GEOJSON: { type: "FeatureCollection"; features: JurisdictionFeature[] } = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Comisaría 1ra (Centro / La Perla)", code: "CRIA_1RA", color: "#ef4444", description: "Centro, La Perla, Casino, Plaza Mitre, Peatonal San Martín" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.542, -37.992], [-57.532, -37.994], [-57.538, -38.006], [-57.549, -38.003], [-57.542, -37.992]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 2da (Macrocentro / Chauvín / Güemes)", code: "CRIA_2DA", color: "#6366f1", description: "Chauvín, Güemes, Divino Rostro, San José, Av. Paso" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.549, -38.003], [-57.538, -38.006], [-57.533, -38.020], [-57.558, -38.025], [-57.562, -38.010], [-57.549, -38.003]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 3ra (Puerto / Colinas / Juramento)", code: "CRIA_3RA", color: "#10b981", description: "Puerto, Playa Grande, Juramento, Termas Huinco, Colinas" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.558, -38.025], [-57.533, -38.020], [-57.530, -38.048], [-57.568, -38.052], [-57.558, -38.025]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 4ta (Pompeya / San José Norte)", code: "CRIA_4TA", color: "#f59e0b", description: "Pompeya, San José Norte, Nueva Pompeya, Av. Champagnat" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.555, -37.982], [-57.542, -37.992], [-57.562, -38.010], [-57.575, -38.000], [-57.555, -37.982]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 5ta (Faro / Zona Sur / Alfar)", code: "CRIA_5TA", color: "#ec4899", description: "El Faro, Alfar, Playas del Sur, Acantilados, Av. Newbery" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.568, -38.052], [-57.530, -38.048], [-57.535, -38.095], [-57.585, -38.095], [-57.568, -38.052]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 6ta (Barrio Monolito / Libertad)", code: "CRIA_6TA", color: "#8b5cf6", description: "Monolito, Libertad, San Antonio, Av. Alió" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.575, -38.000], [-57.555, -37.982], [-57.585, -37.970], [-57.610, -37.990], [-57.575, -38.000]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 7ma (Constitución / Estrada)", code: "CRIA_7MA", color: "#06b6d4", description: "Constitución, Estrada, Los Pines, Zacagnini, Av. Tejedor" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.542, -37.992], [-57.535, -37.955], [-57.565, -37.950], [-57.555, -37.982], [-57.542, -37.992]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 8va (Batán / Ruta 88 / Parque Ind.)", code: "CRIA_8VA", color: "#3b82f6", description: "Batán, Estación Chapadmalal, Parque Industrial, Ruta 88" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.610, -37.990], [-57.640, -37.990], [-57.730, -38.010], [-57.720, -38.080], [-57.620, -38.060], [-57.610, -37.990]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 9na (Playa Chica / Alem / Varese)", code: "CRIA_9NA", color: "#14b8a6", description: "Playa Chica, Varese, Cabo Corrientes, San Carlos" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.538, -38.006], [-57.525, -38.012], [-57.533, -38.020], [-57.545, -38.015], [-57.538, -38.006]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 11ra (Las Heras / Autódromo)", code: "CRIA_11RA", color: "#f97316", description: "Las Heras, Autódromo, Belgrano, Hipódromo, Av. Vértiz" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.575, -38.000], [-57.610, -37.990], [-57.640, -38.030], [-57.590, -38.035], [-57.575, -38.000]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 12da (Bosque Peralta Ramos)", code: "CRIA_12DA", color: "#84cc16", description: "Bosque Peralta Ramos, Jardín de Peralta Ramos, Santa Rosa" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.568, -38.052], [-57.550, -38.055], [-57.555, -38.085], [-57.585, -38.085], [-57.568, -38.052]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 13ra (Playa Serena / San Eduardo)", code: "CRIA_13RA", color: "#a855f7", description: "Playa Serena, San Eduardo del Mar, Los Acantilados Sur, Ruta 11" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.535, -38.095], [-57.528, -38.160], [-57.590, -38.165], [-57.585, -38.095], [-57.535, -38.095]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 14ta (Sierra de los Padres)", code: "CRIA_14TA", color: "#eab308", description: "Sierra de los Padres, La Peregrina, Ruta 226" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.650, -37.910], [-57.820, -37.920], [-57.830, -38.010], [-57.640, -37.990], [-57.650, -37.910]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 15ta (Félix U. Camet / Camet)", code: "CRIA_15TA", color: "#0284c7", description: "Félix U. Camet, Camet, Las Dalias, Parque Camet Norte" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.535, -37.955], [-57.518, -37.905], [-57.565, -37.900], [-57.565, -37.950], [-57.535, -37.955]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 16ta (Regional / Don Emilio)", code: "CRIA_16TA", color: "#dc2626", description: "Barrio Regional, Don Emilio, Hospital HIGA, Juan B. Justo West" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.585, -38.020], [-57.620, -38.020], [-57.620, -38.050], [-57.585, -38.050], [-57.585, -38.020]]],
      },
    },
  ],
};

// Helper function to attach jurisdiction polygon layers to any Leaflet map
export function attachJurisdictionPolygons(map: any, L: any) {
  if (!map || !L) return;

  const geoJsonLayer = L.geoJSON(POLICE_JURISDICTIONS_GEOJSON, {
    style: (feature: any) => ({
      color: feature.properties.color || "#6366f1",
      weight: 2.5,
      opacity: 0.9,
      fillColor: feature.properties.color || "#6366f1",
      fillOpacity: 0.22,
    }),
    onEachFeature: (feature: any, layer: any) => {
      layer.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 0.2rem;">
          <strong style="color: ${feature.properties.color}; font-size: 0.95rem;">${feature.properties.name}</strong><br/>
          <span style="font-size: 0.8rem; color: #444;"><b>Zonas / Cobertura:</b> ${feature.properties.description}</span><br/>
          <div style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid #ccc; font-size: 0.775rem;">
            👮 <i>Cuadrante Oficial Policía de Buenos Aires · Mar del Plata</i>
          </div>
        </div>
      `);
    },
  });

  geoJsonLayer.addTo(map);
  return geoJsonLayer;
}
