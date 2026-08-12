/**
 * GeoJSON polygon boundaries for the 16 Police Jurisdiction Sectors of General Pueyrredón (Comisarías 1ra a 16ta).
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
      properties: { name: "Comisaría 1ra (Centro / La Perla)", code: "CRIA_1RA", color: "#ef4444", description: "Centro, La Perla, Casino, Plaza Mitre" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.540, -37.995], [-57.555, -37.995], [-57.555, -38.010], [-57.540, -38.010], [-57.540, -37.995]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 2da (Macrocentro / Chauvín / Güemes)", code: "CRIA_2DA", color: "#6366f1", description: "Chauvín, Güemes, Divino Rostro, San José" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.545, -38.010], [-57.565, -38.010], [-57.565, -38.025], [-57.545, -38.025], [-57.545, -38.010]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 3ra (Puerto / Playa Grande)", code: "CRIA_3RA", color: "#10b981", description: "Puerto, Playa Grande, Juramento, Termas Huinco" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.530, -38.025], [-57.570, -38.025], [-57.570, -38.055], [-57.530, -38.055], [-57.530, -38.025]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 4ta (Pompeya / San José)", code: "CRIA_4TA", color: "#f59e0b", description: "Pompeya, San José, Nueva Pompeya" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.555, -37.980], [-57.575, -37.980], [-57.575, -38.000], [-57.555, -38.000], [-57.555, -37.980]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 5ta (Faro / Zona Sur / Acantilados)", code: "CRIA_5TA", color: "#ec4899", description: "El Faro, Alfar, Playas del Sur, Acantilados" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.530, -38.055], [-57.590, -38.055], [-57.590, -38.100], [-57.530, -38.100], [-57.530, -38.055]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 6ta (Barrio Monolito / Libertad)", code: "CRIA_6TA", color: "#8b5cf6", description: "Monolito, Libertad, San Antonio" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.575, -37.965], [-57.610, -37.965], [-57.610, -37.995], [-57.575, -37.995], [-57.575, -37.965]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 7ma (Constitución / Estrada)", code: "CRIA_7MA", color: "#06b6d4", description: "Constitución, Estrada, Los Pines, Zacagnini" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.535, -37.950], [-57.575, -37.950], [-57.575, -37.980], [-57.535, -37.980], [-57.535, -37.950]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 8va (Batán / Ruta 88)", code: "CRIA_8VA", color: "#3b82f6", description: "Batán, Estación Chapadmalal, Parque Industrial" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.610, -37.980], [-57.750, -37.980], [-57.750, -38.100], [-57.610, -38.100], [-57.610, -37.980]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 9na (Playa Chica / Alem)", code: "CRIA_9NA", color: "#14b8a6", description: "Playa Chica, Varese, San Carlos" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.525, -38.010], [-57.545, -38.010], [-57.545, -38.025], [-57.525, -38.025], [-57.525, -38.010]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 11ra (Las Heras / Autódromo)", code: "CRIA_11RA", color: "#f97316", description: "Las Heras, Autódromo, Belgrano, Hipódromo" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.590, -37.950], [-57.640, -37.950], [-57.640, -37.990], [-57.590, -37.990], [-57.590, -37.950]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 12da (Bosque Peralta Ramos)", code: "CRIA_12DA", color: "#84cc16", description: "Bosque Peralta Ramos, Jardín de Peralta Ramos" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.550, -38.055], [-57.585, -38.055], [-57.585, -38.085], [-57.550, -38.085], [-57.550, -38.055]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 13ra (Playa Serena / San Eduardo)", code: "CRIA_13RA", color: "#a855f7", description: "Playa Serena, San Eduardo del Mar, Los Acantilados" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.530, -38.100], [-57.620, -38.100], [-57.620, -38.180], [-57.530, -38.180], [-57.530, -38.100]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 14ta (Sierra de los Padres)", code: "CRIA_14TA", color: "#eab308", description: "Sierra de los Padres, La Gloria de la Peregrina, Ruta 226" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.650, -37.900], [-57.850, -37.900], [-57.850, -38.020], [-57.650, -38.020], [-57.650, -37.900]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 15ta (Félix U. Camet)", code: "CRIA_15TA", color: "#0284c7", description: "Félix U. Camet, Camet, Las Dalias, Parque Camet" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.520, -37.900], [-57.580, -37.900], [-57.580, -37.950], [-57.520, -37.950], [-57.520, -37.900]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Comisaría 16ta (Regional / Belgrano / Don Emilio)", code: "CRIA_16TA", color: "#dc2626", description: "Barrio Regional, Don Emilio, Coronel Vidal" },
      geometry: {
        type: "Polygon",
        coordinates: [[[-57.590, -38.010], [-57.640, -38.010], [-57.640, -38.050], [-57.590, -38.050], [-57.590, -38.010]]],
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
      weight: 2,
      opacity: 0.7,
      fillColor: feature.properties.color || "#6366f1",
      fillOpacity: 0.12,
      dashArray: "4, 4",
    }),
    onEachFeature: (feature: any, layer: any) => {
      layer.bindPopup(`
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111;">
          <strong style="color: ${feature.properties.color}; fontSize: 0.95rem;">${feature.properties.name}</strong><br/>
          <b>Barrios / Cobertura:</b> ${feature.properties.description}<br/>
          <i style="color: #666; font-size: 0.75rem;">Jurisdicción Policial de General Pueyrredón</i>
        </div>
      `);
    },
  });

  geoJsonLayer.addTo(map);
  return geoJsonLayer;
}
