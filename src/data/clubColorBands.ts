import type { BrazilianClub } from "./brazilianClubs";

// Identity palettes for the circular marks only; interface theme colors stay unchanged.
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const BLUE = "#40BFF0";
const YELLOW = "#FFD700";
const GREEN = "#006437";
const RED = "#E30613";

const identityBands: Record<string, readonly string[]> = {
  gremio: [BLACK, WHITE, BLUE, WHITE, BLACK, WHITE, BLUE, WHITE, BLACK],
  bahia: ["#004A99", WHITE, RED],
  fluminense: ["#7B2D42", WHITE, GREEN],
  "sao-paulo": [RED, WHITE, BLACK],
  "botafogo-sp": [RED, WHITE, BLACK],
  "america-mg": [GREEN, WHITE, BLACK],
  mirassol: [YELLOW, GREEN],
  criciuma: [YELLOW, BLACK, WHITE],
  novorizontino: [YELLOW, BLACK],
  "sao-bernardo": [YELLOW, BLACK],
  amazonas: [YELLOW, BLACK],
  remo: ["#101D3C", WHITE],
  brusque: [GREEN, RED, YELLOW],
  caxias: ["#7B2D42", WHITE, "#004A99"],
  "inter-de-limeira": [BLACK, WHITE],
  anapolis: [RED, WHITE, BLACK],
  maranhao: ["#004A99", WHITE, RED, WHITE, BLACK],
  maringa: [GREEN, WHITE, BLACK],
  paysandu: [BLUE, WHITE],
  "santa-cruz": [RED, WHITE, BLACK],
  "volta-redonda": [YELLOW, BLACK, WHITE],
  "ypiranga-rs": [YELLOW, GREEN],
};

export const getClubColorBands = (club: Pick<BrazilianClub, "id" | "primaryColor" | "secondaryColor">): readonly string[] =>
  identityBands[club.id] ?? [club.primaryColor, club.secondaryColor];