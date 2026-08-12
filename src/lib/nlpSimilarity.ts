/**
 * NLP Keyword Similarity Engine for discovering "Twin Cases" (Casos Gemelos / Modus Operandi Matching).
 */

export interface SimilarIncidentResult {
  incident: any;
  similarityScore: number; // 0 to 100
  matchedKeywords: string[];
}

const STOP_WORDS = new Set([
  "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una", "su",
  "al", "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este", "sí", "porque", "esta", "entre", "cuando", "muy",
  "sin", "sobre", "también", "me", "hasta", "hay", "donde", "quien", "desde", "todo", "nos", "durante", "todos",
  "uno", "les", "ni", "contra", "otros", "ese", "eso", "ante", "ellos", "e", "esto", "mí", "antes", "algunos",
  "unos", "yo", "otro", "otras", "otra", "él", "tanto", "esa", "estos", "mucho", "quienes", "nada", "muchos",
  "cual", "poco", "ella", "estar", "estas", "algunas", "algo", "nosotros", "mi", "mis", "tú", "te", "ti", "tu", "tus",
  "refiere", "manifiesta", "informa", "masculino", "femenina", "llamante", "personal", "policial"
]);

export function calculateNLPSimilarity(relato1: string, relato2: string): { score: number; keywords: string[] } {
  if (!relato1 || !relato2) return { score: 0, keywords: [] };

  const tokenize = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  };

  const tokens1 = tokenize(relato1);
  const tokens2 = tokenize(relato2);

  if (tokens1.length === 0 || tokens2.length === 0) return { score: 0, keywords: [] };

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);

  const matchedKeywords: string[] = [];
  set1.forEach((w) => {
    if (set2.has(w)) {
      matchedKeywords.push(w);
    }
  });

  const unionSize = new Set([...tokens1, ...tokens2]).size;
  const jaccard = unionSize > 0 ? matchedKeywords.length / unionSize : 0;

  // Boost score if specific high-value investigative terms match
  let boost = 0;
  const highValueTerms = ["9mm", "disparos", "encañono", "calibre", "revolver", "tornado", "wave", "titan", "208", "fiat", "garage", "armado"];
  highValueTerms.forEach((term) => {
    if (set1.has(term) && set2.has(term)) {
      boost += 0.15;
    }
  });

  const finalScore = Math.min(100, Math.round((jaccard + boost) * 100));

  return { score: finalScore, keywords: matchedKeywords };
}

export function findSimilarIncidents(targetIncident: any, allIncidents: any[], topN: number = 6): SimilarIncidentResult[] {
  if (!targetIncident || !allIncidents || allIncidents.length === 0) return [];

  const targetRelato = targetIncident.Relato || targetIncident.relato || "";
  const targetId = targetIncident.ID;

  const results: SimilarIncidentResult[] = [];

  allIncidents.forEach((inc) => {
    if (inc.ID === targetId) return; // Skip self

    const currentRelato = inc.Relato || inc.relato || "";
    const { score, keywords } = calculateNLPSimilarity(targetRelato, currentRelato);

    if (score >= 15 && keywords.length >= 2) {
      results.push({
        incident: inc,
        similarityScore: score,
        matchedKeywords: keywords,
      });
    }
  });

  return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, topN);
}
