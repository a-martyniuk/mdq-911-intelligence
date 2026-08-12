import React from "react";

export interface ExtractedEntities {
  patentes: string[];
  weapons: string[];
  brands: string[];
  modusOperandi: string[];
}

// Regex patterns for entity extraction
const PATENTE_REGEX = /\b([A-Z]{2}\s?\d{3}\s?[A-Z]{2}|[A-Z]{3}\s?\d{3})\b/gi;

const WEAPONS_KEYWORDS = [
  "9mm", "9 mm", "calibre 38", "calibre .38", ".38", "calibre 22", "calibre .22", ".22",
  "revólver", "revolver", "pistola", "escopeta", "carabina", "arma de fuego", "armado",
  "armados", "encañonó", "encañonaron", "disparo", "disparos", "vaina", "cartucho"
];

const BRANDS_KEYWORDS = [
  "honda wave", "honda tornado", "honda titan", "honda twister", "honda",
  "zanella zb", "zanella rx", "zanella", "yamaha ybr", "yamaha fz", "yamaha",
  "motomel", "corven", "gilera", "fiat uno", "fiat palio", "fiat duna", "fiat cronos", "fiat",
  "peugeot 208", "peugeot 206", "peugeot 308", "peugeot", "vw gol", "vw fox", "volkswagen",
  "toyota hilux", "toyota corolla", "toyota", "chevrolet corsa", "chevrolet celta", "chevrolet",
  "ford fiesta", "ford ka", "ford ranger", "ford", "renault clio", "renault kangoo", "renault"
];

const MODUS_OPERANDI_KEYWORDS = [
  "mano armada", "vía pública", "via publica", "estacionado", "llave corrida",
  "garage", "cochera", "puerta de la finca", "desguace", "enfriamiento",
  "sustracción", "sustraccion", "asfalto", "barrio", "forcejeo", "intimidación"
];

/**
 * Extracts structured entities from a relato string.
 */
export function extractEntities(text: string): ExtractedEntities {
  if (!text) return { patentes: [], weapons: [], brands: [], modusOperandi: [] };

  const matchesPatentes = text.match(PATENTE_REGEX) || [];
  const lowerText = text.toLowerCase();

  const weaponsFound = WEAPONS_KEYWORDS.filter((w) => lowerText.includes(w));
  const brandsFound = BRANDS_KEYWORDS.filter((b) => lowerText.includes(b));
  const modusFound = MODUS_OPERANDI_KEYWORDS.filter((m) => lowerText.includes(m));

  return {
    patentes: Array.from(new Set(matchesPatentes.map((p) => p.toUpperCase()))),
    weapons: Array.from(new Set(weaponsFound)),
    brands: Array.from(new Set(brandsFound.map((b) => b.toUpperCase()))),
    modusOperandi: Array.from(new Set(modusFound)),
  };
}

/**
 * Returns React elements with color-coded entity badges for relato text.
 */
export function highlightRelato(text: string): React.ReactNode {
  if (!text) return <span>Sin relato disponible</span>;

  // Build combined regex pattern for all terms
  const terms: { term: string; type: "weapon" | "brand" | "modus" | "patente" }[] = [];

  const patMatches = Array.from(text.matchAll(PATENTE_REGEX));
  patMatches.forEach((m) => {
    if (m[0]) terms.push({ term: m[0], type: "patente" });
  });

  WEAPONS_KEYWORDS.forEach((w) => {
    if (text.toLowerCase().includes(w)) {
      terms.push({ term: w, type: "weapon" });
    }
  });

  BRANDS_KEYWORDS.forEach((b) => {
    if (text.toLowerCase().includes(b)) {
      terms.push({ term: b, type: "brand" });
    }
  });

  MODUS_OPERANDI_KEYWORDS.forEach((m) => {
    if (text.toLowerCase().includes(m)) {
      terms.push({ term: m, type: "modus" });
    }
  });

  if (terms.length === 0) {
    return <span>{text}</span>;
  }

  // Sort terms by length descending to match longer multi-word phrases first
  terms.sort((a, b) => b.term.length - a.term.length);

  // Escaping terms for regex construction
  const escapedTerms = terms.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const masterRegex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

  const parts = text.split(masterRegex);

  return (
    <span>
      {parts.map((part, idx) => {
        const matchedTerm = terms.find((t) => t.term.toLowerCase() === part.toLowerCase());

        if (!matchedTerm) {
          return <span key={idx}>{part}</span>;
        }

        let bgStyle = "";
        let colorStyle = "";
        let label = "";

        switch (matchedTerm.type) {
          case "weapon":
            bgStyle = "rgba(239, 68, 68, 0.25)";
            colorStyle = "#fca5a5";
            label = "🔫 Arma";
            break;
          case "brand":
            bgStyle = "rgba(59, 130, 246, 0.25)";
            colorStyle = "#93c5fd";
            label = "🚘 Marca";
            break;
          case "modus":
            bgStyle = "rgba(245, 158, 11, 0.25)";
            colorStyle = "#fde047";
            label = "⚡ MO";
            break;
          case "patente":
            bgStyle = "rgba(16, 185, 129, 0.25)";
            colorStyle = "#6ee7b7";
            label = "🏷️ Patente";
            break;
        }

        return (
          <mark
            key={idx}
            style={{
              backgroundColor: bgStyle,
              color: colorStyle,
              padding: "0.15rem 0.35rem",
              borderRadius: "4px",
              margin: "0 0.1rem",
              border: `1px solid ${colorStyle}40`,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.2rem",
            }}
            title={label}
          >
            {part}
          </mark>
        );
      })}
    </span>
  );
}
