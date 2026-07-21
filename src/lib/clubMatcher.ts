import { brazilianClubs } from "@/data/brazilianClubs";

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Strip common suffixes/tokens that FotMob/SofaScore append
const stripSuffix = (s: string) =>
  normalize(s)
    .replace(/\b(fc|ec|sc|af|clube|futebol|de|do|da)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Map raw source names → canonical club id
const ALIASES: Record<string, string> = {
  "atletico mg": "atletico-mg",
  "atletico mineiro": "atletico-mg",
  "clube atletico mineiro": "atletico-mg",
  "athletico pr": "athletico-pr",
  "athletico paranaense": "athletico-pr",
  "atletico paranaense": "athletico-pr",
  "atletico go": "atletico-go",
  "atletico goianiense": "atletico-go",
  "america mg": "america-mg",
  "america mineiro": "america-mg",
  "red bull bragantino": "bragantino",
  "rb bragantino": "bragantino",
  "bragantino": "bragantino",
  "chapecoense": "chapecoense",
  "chapecoense af": "chapecoense",
  "chapecoense sc": "chapecoense",
  "santos": "santos",
  "santos fc": "santos",
  "sao paulo": "sao-paulo",
  "sao paulo fc": "sao-paulo",
  "vasco": "vasco",
  "vasco da gama": "vasco",
  "coritiba": "coritiba",
  "coritiba fc": "coritiba",
  "gremio": "gremio",
  "cuiaba": "cuiaba",
  "goias": "goias",
  "ceara": "ceara",
  "vitoria": "vitoria",
  "criciuma": "criciuma",
};

export const findClubId = (name: string, abbr?: string): string | null => {
  if (!name) return null;
  const n = normalize(name);
  const clean = stripSuffix(name);

  if (ALIASES[n]) return ALIASES[n];
  if (ALIASES[clean]) return ALIASES[clean];

  // 1. Exact name match on raw or cleaned name
  let found = brazilianClubs.find(
    (c) => normalize(c.name) === n || normalize(c.name) === clean,
  );
  if (found) return found.id;

  // 2. Id match
  found = brazilianClubs.find(
    (c) => c.id === clean.replace(/\s+/g, "-") || c.id === n.replace(/\s+/g, "-"),
  );
  if (found) return found.id;

  // 3. Partial prefix/inclusion (min length 5 to avoid Cor* clashes)
  if (clean.length >= 5) {
    found = brazilianClubs.find((c) => {
      const cn = normalize(c.name);
      if (cn.length < 5) return false;
      return cn === clean || cn.startsWith(clean) || clean.startsWith(cn);
    });
    if (found) return found.id;
  }

  // 4. Abbr fallback — LAST resort only. Skip ambiguous 3-letter abbrs
  // shared by multiple club names (e.g. "COR" for Corinthians vs Coritiba).
  if (abbr) {
    const a = abbr.toUpperCase();
    const matches = brazilianClubs.filter((c) => c.shortName.toUpperCase() === a);
    if (matches.length === 1) return matches[0].id;
  }

  return null;
};

// Return a clean display name for the club (strip trailing FC/EC/AF/SC)
export const cleanDisplayName = (name: string): string => {
  if (!name) return name;
  const id = findClubId(name);
  if (id) {
    const c = brazilianClubs.find((x) => x.id === id);
    if (c) return c.name;
  }
  return name.replace(/\s+(FC|EC|SC|AF)$/i, "").trim();
};