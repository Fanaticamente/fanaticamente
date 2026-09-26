const SEP = "\n---\n";

export const buildEmotionNote = (tags: string[], observation: string) => {
  const t = tags.join(", ");
  const o = observation.trim().slice(0, 500);
  return o ? `${t}${SEP}${o}` : t;
};

export const parseEmotionNote = (note?: string | null): { tags: string[]; observation: string } => {
  if (!note) return { tags: [], observation: "" };
  const [tagPart, ...rest] = note.split(SEP);
  return {
    tags: tagPart.split(",").map((s) => s.trim()).filter(Boolean),
    observation: rest.join(SEP).trim(),
  };
};
