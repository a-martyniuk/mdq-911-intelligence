"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Brain, UserCheck, Home, MessageSquare, Search, AlertTriangle, ShieldAlert, Sparkles, Filter, CheckCircle, Tag, Download, FileText, MapPin, Crosshair, Navigation, LocateFixed } from "lucide-react";
import { generateDrogasSuspectsPDF } from "@/lib/pdfReport";
import { exportToCSV } from "@/lib/excelExport";
import "leaflet/dist/leaflet.css";

interface SectionMalvinasNLPProps {
  incidents: any[];
}

export default function SectionMalvinasNLP({ incidents = [] }: SectionMalvinasNLPProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const markerMapRef = useRef<Map<string | number, any>>(new Map());

  // Count geocoded points per suspect/alias
  const suspectGeoCounts = useMemo(() => {
    const counts: { [alias: string]: number } = {};
    incidents.forEach((inc) => {
      if (inc.lat && inc.lng && inc.alias) {
        inc.alias.forEach((a: string) => {
          const clean = a.trim();
          if (clean) {
            counts[clean] = (counts[clean] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [incidents]);

  // Extract Top Aliases and occurrences
  const aliasRanking = useMemo(() => {
    const counts: { [alias: string]: { count: number; lastDate: string; barrios: Set<string>; sampleRelato: string; isFullName: boolean } } = {};

    incidents.forEach((inc) => {
      const aliases = inc.alias || [];
      aliases.forEach((a: string) => {
        const clean = a.trim();
        if (!clean) return;
        if (!counts[clean]) {
          const parts = clean.split(" ");
          const isFullName = parts.length >= 2 && !clean.toLowerCase().startsWith("el ") && !clean.toLowerCase().startsWith("la ");
          counts[clean] = { count: 0, lastDate: inc.fecha, barrios: new Set(), sampleRelato: inc.relato, isFullName };
        }
        counts[clean].count += 1;
        if (inc.barrio && !inc.barrio.includes("General") && !inc.barrio.includes("Centro")) {
          counts[clean].barrios.add(inc.barrio);
        }
      });
    });

    let list = Object.entries(counts)
      .map(([alias, data]) => ({
        alias,
        count: data.count,
        lastDate: data.lastDate,
        barrios: Array.from(data.barrios).join(", ") || "Malvinas Argentinas",
        sampleRelato: data.sampleRelato,
        isFullName: data.isFullName,
      }))
      .sort((a, b) => b.count - a.count);

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      list = list.filter((item) =>
        item.alias.toLowerCase().includes(q) ||
        item.barrios.toLowerCase().includes(q) ||
        item.sampleRelato.toLowerCase().includes(q)
      );
    }

    return list.slice(0, 35);
  }, [incidents, searchTerm]);

  // Points of sale distribution
  const lugaresStats = useMemo(() => {
    const map: { [key: string]: number } = {};
    incidents.forEach((r) => {
      const lug = r.tipoLugar || "Lugar No Especificado";
      map[lug] = (map[lug] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  // Filtered incidents with alias or search keyword
  const filteredIncidents = useMemo(() => {
    let list = incidents;

    if (selectedSuspect) {
      list = list.filter((r) => (r.alias || []).some((a: string) => a.toLowerCase() === selectedSuspect.toLowerCase()));
      return list;
    }

    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      return list.filter((r) =>
        (r.relato || "").toLowerCase().includes(q) ||
        (r.direccion || "").toLowerCase().includes(q) ||
        (r.comentario || "").toLowerCase().includes(q) ||
        (r.alias || []).some((a: string) => a.toLowerCase().includes(q))
      ).slice(0, 35);
    }

    return list.filter((r) => (r.alias && r.alias.length > 0) || r.tieneArmas).slice(0, 30);
  }, [incidents, searchTerm, selectedSuspect]);

  const geocodedFilteredCount = useMemo(() => {
    return filteredIncidents.filter((r) => r.lat && r.lng).length;
  }, [filteredIncidents]);

  // 1. Initialize Map once
  useEffect(() => {
    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [-34.490, -58.718],
          zoom: 13,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        markersGroupRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;
        setMapReady(true);

        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
        markerMapRef.current.clear();
        setMapReady(false);
      }
    };
  }, []);

  // 2. Render markers dynamically when suspect or search filter changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersGroupRef.current) return;

    import("leaflet").then((L) => {
      const group = markersGroupRef.current;
      const map = mapInstanceRef.current;
      if (!group || !map) return;

      group.clearLayers();
      markerMapRef.current.clear();

      const points = filteredIncidents.filter((r) => r.lat && r.lng);

      points.forEach((inc) => {
        const isArmed = inc.tieneArmas;
        const isTargetSuspect = selectedSuspect && (inc.alias || []).some((a: string) => a.toLowerCase() === selectedSuspect.toLowerCase());

        const fillColor = isArmed ? "#ef4444" : isTargetSuspect ? "#8b5cf6" : "#f59e0b";
        const radius = isTargetSuspect ? 8 : (isArmed ? 7 : 5);

        const marker = L.circleMarker([inc.lat, inc.lng], {
          radius,
          fillColor,
          color: "#ffffff",
          weight: isTargetSuspect ? 2.5 : 1.5,
          fillOpacity: 0.88,
        });

        const popupHtml = `
          <div style="font-family:inherit; font-size:0.8rem; line-height:1.45; min-width:210px; max-width:280px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; border-bottom:1px solid #e2e8f0; padding-bottom:3px;">
              <strong style="color:${isArmed ? '#dc2626' : '#6366f1'};">ID 911 #${inc.id}</strong>
              <span style="font-size:0.7rem; color:#64748b;">${inc.fecha}</span>
            </div>
            ${selectedSuspect ? `
              <div style="display:inline-flex; align-items:center; gap:3px; background:#ede9fe; color:#6d28d9; font-weight:700; font-size:0.72rem; padding:2px 7px; border-radius:4px; margin-bottom:5px;">
                👤 Investigado: ${selectedSuspect}
              </div><br/>
            ` : (inc.alias && inc.alias.length ? `
              <div style="color:#d97706; font-size:0.72rem; font-weight:700; margin-bottom:4px;">
                🏷️ ${inc.alias.join(", ")}
              </div>
            ` : "")}
            <div style="font-size:0.78rem; color:#1e293b; margin-bottom:2px;">
              📍 <strong>${inc.direccion || "Malvinas Argentinas"}</strong>
            </div>
            <div style="font-size:0.72rem; color:#64748b; margin-bottom:6px;">
              Barrio: ${inc.barrio || "Centro / General"} (${inc.tipoLugar || "Lugar"})
            </div>
            <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px;">
              <span style="background:#fee2e2; color:#dc2626; font-weight:700; font-size:0.7rem; padding:1px 5px; border-radius:3px;">💊 ${inc.sustancia || "Drogas"}</span>
              ${isArmed ? `<span style="background:#fecaca; color:#991b1b; font-weight:700; font-size:0.7rem; padding:1px 5px; border-radius:3px;">⚠️ ARMAS</span>` : ""}
            </div>
            <div style="background:#f8fafc; padding:6px 8px; border-radius:4px; border:1px solid #e2e8f0; font-size:0.73rem; color:#334155; max-height:85px; overflow-y:auto; line-height:1.35;">
              "${inc.relato}"
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.addTo(group);
        markerMapRef.current.set(inc.id, marker);
      });

      // Fit bounds to points if suspect selected or search active
      if (points.length > 0) {
        if (selectedSuspect || searchTerm.trim() !== "") {
          const latLngs = points.map((p) => [p.lat, p.lng] as [number, number]);
          const bounds = L.latLngBounds(latLngs);
          map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true });
        } else {
          map.setView([-34.490, -58.718], 13);
        }
      } else {
        map.setView([-34.490, -58.718], 13);
      }
    });
  }, [filteredIncidents, selectedSuspect, searchTerm, mapReady]);

  const panToIncident = (inc: any) => {
    if (!mapInstanceRef.current || !inc.lat || !inc.lng) return;
    mapInstanceRef.current.setView([inc.lat, inc.lng], 16, { animate: true });
    const marker = markerMapRef.current.get(inc.id);
    if (marker) {
      marker.openPopup();
    }
  };

  const reCenterMap = () => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const points = filteredIncidents.filter((r) => r.lat && r.lng);
      if (points.length > 0) {
        const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: true });
      } else {
        mapInstanceRef.current.setView([-34.490, -58.718], 13);
      }
    });
  };

  return (
    <div className="animate-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Header Banner */}
      <div className="card" style={{ background: "linear-gradient(90deg, #101623 0%, #131c2d 100%)", borderColor: "var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ padding: "0.65rem", borderRadius: "var(--radius-sm)", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
              <Brain size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "19px", fontWeight: 600, margin: 0, color: "var(--text-primary)", letterSpacing: "-0.015em" }}>
                Inteligencia de Redes, Alias & Modus Operandi Narcocriminal (NLP)
              </h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>
                Extracción algorítmica de apodos de transas, estructura de búnkers y léxico delictual en 1.471 despachos de Malvinas Argentinas.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            {selectedSuspect && (
              <button
                onClick={() => setSelectedSuspect(null)}
                className="btn-export"
                style={{ padding: "6px 12px", border: "1px solid rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.12)", color: "#f87171" }}
              >
                Quitar filtro: {selectedSuspect} ✕
              </button>
            )}

            <button
              onClick={() => {
                generateDrogasSuspectsPDF({
                  suspects: aliasRanking,
                  totalSuspects: aliasRanking.length,
                  totalIncidents: incidents.length,
                  allIncidents: incidents,
                  selectedSuspect: selectedSuspect,
                  partido: "Malvinas Argentinas",
                });
              }}
              className="btn-export btn-pdf"
              style={{ padding: "7px 14px" }}
              title={selectedSuspect ? `Descargar dossier con todos los llamados de ${selectedSuspect} sin truncar y con mapa` : "Descargar dossier judicial completo de sospechosos"}
            >
              <FileText size={14} /> {selectedSuspect ? `Dossier: ${selectedSuspect} (PDF)` : "Dossier Judicial (PDF)"}
            </button>

            {selectedSuspect && (
              <button
                onClick={() => {
                  generateDrogasSuspectsPDF({
                    suspects: aliasRanking,
                    totalSuspects: aliasRanking.length,
                    totalIncidents: incidents.length,
                    allIncidents: incidents,
                    selectedSuspect: null,
                    partido: "Malvinas Argentinas",
                  });
                }}
                className="btn-export btn-pdf"
                style={{ padding: "7px 14px" }}
                title="Descargar dossier general con todos los sospechosos agrupados y mapas"
              >
                <FileText size={14} /> Dossier General (Todos)
              </button>
            )}

            <button
              onClick={() => {
                const exportData = aliasRanking.map((s, idx) => ({
                  Ranking: idx + 1,
                  Identificacion: s.alias,
                  Tipo: s.isFullName ? "Nombre Completo" : "Alias / Apodo",
                  Menciones_911: s.count,
                  Barrios_Operacion: s.barrios,
                  Ultima_Fecha: s.lastDate,
                  Muestra_Relato: s.sampleRelato
                }));
                exportToCSV("sospechosos_alias_malvinas_argentinas", exportData);
              }}
              className="btn-export btn-excel"
              style={{ padding: "7px 14px" }}
            >
              <Download size={14} /> Exportar Sospechosos (Excel)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Aliases + Puntos de Venta */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Top Aliases Identified with Filter trigger */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <div className="card-title" style={{ gap: "0.5rem", margin: 0 }}>
              <UserCheck size={18} color="var(--accent-indigo)" />
              <span>Alias y Nombres de Investigados Extraídos por NLP</span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              Hacé clic para auditar despachos
            </span>
          </div>
          <p className="card-subtitle" style={{ marginBottom: "1rem" }}>
            Individuos señalados reiteradamente en denuncias vecinales al 911 como responsables de comercialización:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", maxHeight: "490px", overflowY: "auto", paddingRight: "0.3rem" }}>
            {aliasRanking.map((item, idx) => {
              const isSelected = selectedSuspect?.toLowerCase() === item.alias.toLowerCase();
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedSuspect(isSelected ? null : item.alias)}
                  style={{
                    background: isSelected ? "rgba(239,68,68,0.15)" : "var(--bg-base)",
                    border: isSelected ? "1.5px solid #ef4444" : "1px solid var(--border)",
                    padding: "0.75rem 1rem",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {item.alias}
                      </span>
                      {item.isFullName ? (
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", padding: "1px 5px", borderRadius: "3px" }}>
                          Nombre Identificado
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.65rem", fontWeight: 700, background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "1px 5px", borderRadius: "3px" }}>
                          Alias / Apodo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      📍 {item.barrios}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, padding: "0.2rem 0.6rem", borderRadius: "4px", background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                      {item.count} denuncias
                    </span>
                    {suspectGeoCounts[item.alias] > 0 && (
                      <div style={{ fontSize: "0.68rem", color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px", justifyContent: "flex-end", marginTop: "3px" }}>
                        📍 {suspectGeoCounts[item.alias]} en mapa
                      </div>
                    )}
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      Último: {item.lastDate?.split(" ")[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Puntos de Venta & Señales Tácticas */}
        <div className="card">
          <div className="card-title" style={{ gap: "0.5rem" }}>
            <Home size={18} color="#10b981" />
            <span>Tipología de Espacios de Expendio</span>
          </div>
          <p className="card-subtitle" style={{ marginBottom: "1rem" }}>
            Clasificación del entorno físico denunciado por los vecinos:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.5rem" }}>
            {lugaresStats.map(([lugar, count], idx) => {
              const pct = (count / incidents.length) * 100;
              return (
                <div key={idx} style={{ background: "var(--bg-base)", padding: "0.75rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.3rem" }}>
                    <span style={{ color: "var(--text-primary)" }}>{lugar}</span>
                    <span style={{ color: "var(--accent-indigo)" }}>{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#10b981", borderRadius: "3px" }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card-title" style={{ gap: "0.5rem", fontSize: "0.95rem" }}>
            <Sparkles size={16} color="#f59e0b" />
            <span>Señales Operativas & Modus Operandi Recurrente</span>
          </div>
          <ul style={{ paddingLeft: "1.2rem", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0.5rem 0 0" }}>
            <li><strong>Señas sonoras:</strong> Vecinos reportan señas ("silbar dos veces") para que el transa se acerque al portón o ventanita.</li>
            <li><strong>Música y permanencia:</strong> Búnkers con parlantes en la vereda para enmascarar conversaciones y permanencia de compradores.</li>
            <li><strong>Canje por ilícitos:</strong> Intercambio directo de rodados hurtados (bicicletas / motos) por dosis de paco o cocaína.</li>
          </ul>
        </div>
      </div>

      {/* Dynamic Georeferencing Map & Despachos Correlacionados */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "1.5rem" }}>
        {/* Left Column: Interactive Suspect / Alias Map */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "0.75rem" }}>
            <div>
              <div className="card-title" style={{ gap: "0.5rem", margin: 0 }}>
                <MapPin size={18} color={selectedSuspect ? "#8b5cf6" : "#ef4444"} />
                <span>
                  {selectedSuspect
                    ? `Mapa Territorial de "${selectedSuspect}"`
                    : "Georreferenciación de Redes & Despachos NLP"}
                </span>
              </div>
              <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
                {selectedSuspect
                  ? `Mostrando ${geocodedFilteredCount} de ${filteredIncidents.length} despachos con coordenadas vinculados a ${selectedSuspect}:`
                  : "Ubicaciones de denuncias con mención de alias o estupefacientes en Malvinas Argentinas:"}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "0.25rem 0.6rem",
                  borderRadius: "4px",
                  background: geocodedFilteredCount > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(156, 163, 175, 0.15)",
                  color: geocodedFilteredCount > 0 ? "#10b981" : "var(--text-muted)",
                }}
              >
                📍 {geocodedFilteredCount} / {filteredIncidents.length} en mapa
              </span>

              <button
                onClick={reCenterMap}
                title="Recentrar y encuadrar todos los puntos en el mapa"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  height: "30px",
                  padding: "0 0.65rem",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Crosshair size={13} />
                <span>Recentrar</span>
              </button>
            </div>
          </div>

          {/* Map Legend & Active Target Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
              background: "var(--bg-base)",
              padding: "0.45rem 0.75rem",
              borderRadius: "6px",
              marginBottom: "0.75rem",
              border: "1px solid var(--border)",
              fontSize: "0.72rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
                Armas / Balaceras
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }}></span>
                {selectedSuspect ? `Vinculado a ${selectedSuspect}` : "Sospechoso con Alias"}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
                Punto de Venta / Búnker
              </span>
            </div>
            {selectedSuspect && (
              <span style={{ color: "var(--accent-indigo)", fontWeight: 700 }}>
                Filtro activo: {selectedSuspect}
              </span>
            )}
          </div>

          {/* Leaflet Map Canvas */}
          <div
            ref={mapContainerRef}
            style={{
              width: "100%",
              height: "530px",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              overflow: "hidden",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        {/* Right Column: Despachos / Relatos Auditoría */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.8rem", marginBottom: "0.75rem" }}>
            <div>
              <div className="card-title" style={{ gap: "0.5rem", margin: 0 }}>
                <MessageSquare size={18} color="var(--accent-indigo)" />
                <span>
                  {selectedSuspect
                    ? `Despachos: "${selectedSuspect}" (${filteredIncidents.length})`
                    : `Relatos 911 Auditados (${filteredIncidents.length})`}
                </span>
              </div>
              <p className="card-subtitle" style={{ margin: "0.2rem 0 0" }}>
                {selectedSuspect
                  ? `Denuncias al 911 donde se señala la actividad de ${selectedSuspect}:`
                  : "Muestra de llamados con mención de alias delictivos y narcotráfico:"}
              </p>
            </div>

            {!selectedSuspect && (
              <div style={{ width: "240px" }}>
                <input
                  type="text"
                  placeholder="Filtrar despachos o calles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ width: "100%", height: "32px", fontSize: "0.75rem" }}
                />
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "580px", overflowY: "auto", paddingRight: "0.4rem" }}>
            {filteredIncidents.map((inc, i) => {
              const hasCoords = Boolean(inc.lat && inc.lng);
              return (
                <div key={i} style={{ background: "var(--bg-base)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, marginBottom: "0.4rem" }}>
                    <span style={{ color: "var(--accent-indigo)" }}>
                      ID 911 #{inc.id} | {inc.tipoLugar || "Lugar"}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      {inc.fecha} ({inc.franja}) | {inc.barrio}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem", alignItems: "center" }}>
                    <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                      💊 {inc.sustancia || "Drogas"}
                    </span>
                    {inc.tieneArmas && (
                      <span style={{ background: "rgba(220,38,38,0.2)", color: "#f87171", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                        ⚠️ ARMAS / DISPAROS
                      </span>
                    )}
                    {inc.alias && inc.alias.map((a: string, aIdx: number) => (
                      <span key={aIdx} style={{ background: "rgba(245,158,11,0.2)", color: "#fbbf24", padding: "2px 6px", borderRadius: "4px", fontWeight: 700, fontSize: "0.72rem" }}>
                        🏷️ {a}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.4rem" }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                      📍 <strong>{inc.direccion || "Malvinas Argentinas"}</strong> {inc.comentario ? `(${inc.comentario})` : ""}
                    </div>

                    {hasCoords ? (
                      <button
                        onClick={() => panToIncident(inc)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "var(--accent-indigo)",
                          border: "1px solid rgba(99, 102, 241, 0.35)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        title="Localizar este incidente en el mapa"
                      >
                        <MapPin size={12} /> Ver en Mapa
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                        (Sin coordenadas exactas)
                      </span>
                    )}
                  </div>

                  <div style={{ background: "var(--bg-card)", padding: "0.6rem", borderRadius: "4px", border: "1px solid var(--border)", color: "var(--text-secondary)", lineHeight: 1.4, fontSize: "0.76rem" }}>
                    {inc.relato}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


