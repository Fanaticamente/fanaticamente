export type LegalSystem = "fan" | "work";

export function filterLegalSystem<T extends { slug: string }>(rows: T[], system: LegalSystem): T[] {
  const slugs = system === "work"
    ? ["terms-of-use-professional", "privacy-policy-professional"]
    : ["terms-of-use", "privacy-policy"];
  return rows.filter((row) => slugs.includes(row.slug));
}

export function legalReportTargets<T extends { id: string }>(rows: T[], selected: Set<string>): T[] {
  return selected.size ? rows.filter((row) => selected.has(row.id)) : rows;
}