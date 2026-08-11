"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

interface GeoPoint {
  id: number;
  lat: number;
  lng: number;
  tipo: string;
  subtipo: string;
  direccion: string;
  fecha: string;
  origen: string;
  franja: string;
  dia: string;
  hora: number;
  marca?: string;
  patente?: string;
  relato?: string;
}

interface SectionMapProps {
  geoPoints: GeoPoint[];
}

// Client-only Leaflet Container component
function MapComponent({ points }: { points: GeoPoint[] }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import("leaflet").then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!L) return;

    const map = L.map("leaflet-map", {
      center: [-38.00, -57.56],
      zoom: 12,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    // Limit to 800 markers max for crisp performance
    const samplePoints = points.slice(0, 800);

    const getOriginColor = (origen: string) => {
      switch (origen) {
        case "ROBO_AUTO_MOTO": return "#ef4444";
        case "HALLAZGO_AUTOMOTOR": return "#10b981";
        case "DISPAROS_PERSONAS": return "#f59e0b";
        case "ARMA_FUEGO": return "#8b5cf6";
        default: return "#06b6d4";
      }
    };

    samplePoints.forEach((pt) => {
      const circle = L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        fillColor: getOriginColor(pt.origen),
        color: "#000",
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.75,
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 0.85rem; color: #111; padding: 4px; max-width: 280px;">
          <strong style="color: #d97706;">ID: ${pt.id}</strong> - ${pt.origen}<br/>
          <b>Tipo:</b> ${pt.tipo} (${pt.subtipo})<br/>
          <b>Dirección:</b> ${pt.direccion}<br/>
          <b>Fecha:</b> ${pt.fecha}<br/>
          ${pt.patente ? `<b>Patente NLP:</b> <span style="background:#fef08a; padding:1px 4px; border-radius:3px; font-weight:bold;">${pt.patente}</span><br/>` : ""}
          ${pt.marca && pt.marca !== "NO ESPECIFICADO" ? `<b>Marca:</b> ${pt.marca}<br/>` : ""}
          ${pt.relato ? `<div style="margin-top:6px; padding:6px; background:#f3f4f6; border-radius:4px; font-size:0.75rem; color:#374151; max-height:100px; overflow-y:auto;"><b>Relato 911:</b> "${pt.relato}"</div>` : ""}
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [L, points]);

  return <div id="leaflet-map" style={{ width: "100%", height: "650px", borderRadius: "var(--radius-md)" }} />;
}

export default function SectionMap({ geoPoints }: SectionMapProps) {
  return (
    <div>
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-title">📍 Mapa de Distribución Geográfica de Incidentes 911</div>
        <p className="card-subtitle">
          Exploración interactiva con zoom, pan y popups descriptivos sobre el Partido de General Pueyrredón ({geoPoints.length.toLocaleString()} puntos georreferenciados procesados).
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem", fontSize: "0.8rem" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} /> Robo Auto-Moto
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981" }} /> Hallazgo Automotor
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }} /> Disparos a Personas
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#8b5cf6" }} /> Armas de Fuego
          </span>
        </div>

        <MapComponent points={geoPoints} />
      </div>
    </div>
  );
}
