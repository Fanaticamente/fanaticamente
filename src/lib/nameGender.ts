// Heuristic: infer gender from Brazilian Portuguese first name.
export const isFemaleName = (fullName: string) => {
  const first = (fullName || "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (!first) return false;
  const maleExceptions = new Set([
    "luca", "costa", "silva", "andrea", "sasha", "elias", "dias",
    "jonas", "tobias", "matias", "isaias", "aoba",
  ]);
  if (maleExceptions.has(first)) return false;
  const femaleOverrides = new Set([
    "lais", "laís", "ines", "inês", "beatriz", "iris", "íris", "mercedes",
    "isis", "ísis", "raquel", "isabel", "cris", "esther", "ruth",
    "judith", "abigail", "carmen", "miriam", "myriam", "eunice",
    "dolores", "solange", "heloise", "eloise", "eloá", "eloa", "agnes",
    "damaris", "noemi", "noemí", "rebeca", "sarai", "tamar",
    "yasmin", "jasmin", "carol", "sol", "flor", "mel",
  ]);
  if (femaleOverrides.has(first)) return true;
  return /a$/.test(first);
};
