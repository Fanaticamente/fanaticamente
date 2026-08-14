/**
 * Utilities to clean and render news body text while preserving the exact
 * paragraph/line breaks typed by the editor in the manager.
 */

/** Removes photo credits and duplicated lines, keeping blank lines intact. */
export const cleanNewsContent = (content: string): string => {
  let cleaned = content || "";

  cleaned = cleaned.replace(/—?\s*Foto:\s*[^\n]+/gi, "");
  cleaned = cleaned.replace(/[A-Za-zÀ-ú\s]+—\s*Foto:\s*[^\n]+/gi, "");

  const lines = cleaned.split("\n");
  const output: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      // Preserve blank lines (paragraph separators)
      output.push("");
      continue;
    }
    if (seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    output.push(line);
  }

  return output.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

/**
 * Splits text into paragraphs. Blank lines separate paragraphs; single
 * newlines inside a paragraph are preserved as line breaks.
 */
export const toParagraphs = (content: string): string[] =>
  (content || "")
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^\n+|\n+$/g, ""))
    .filter((p) => p.trim().length > 0);
