import { brazilianClubs } from "@/data/brazilianClubs";
import { cn } from "@/lib/utils";

// Custom jersey images per club (override the generated flag pattern)
import jerseyAthleticoPr from "@/assets/jerseys/athletico-pr.webp";
import jerseyAtleticoMg from "@/assets/jerseys/atletico-mg.webp";
import jerseyBahia from "@/assets/jerseys/bahia.webp";
import jerseyBotafogo from "@/assets/jerseys/botafogo.webp";
import jerseyBragantino from "@/assets/jerseys/bragantino.webp";
import jerseyChapecoense from "@/assets/jerseys/chapecoense.webp";
import jerseyCorinthians from "@/assets/jerseys/corinthians.webp";
import jerseyCoritiba from "@/assets/jerseys/coritiba.webp";
import jerseyCruzeiro from "@/assets/jerseys/cruzeiro.webp";
import jerseyFlamengo from "@/assets/jerseys/flamengo.webp";
import jerseyFluminense from "@/assets/jerseys/fluminense.webp";
import jerseyGremio from "@/assets/jerseys/gremio.webp";
import jerseyInternacional from "@/assets/jerseys/internacional.webp";
import jerseyMirassol from "@/assets/jerseys/mirassol.webp";
import jerseyPalmeiras from "@/assets/jerseys/palmeiras.webp";
import jerseyRemo from "@/assets/jerseys/remo.webp";
import jerseySantos from "@/assets/jerseys/santos.webp";
import jerseySaoPaulo from "@/assets/jerseys/sao-paulo.webp";
import jerseyVasco from "@/assets/jerseys/vasco.webp";
import jerseyVitoria from "@/assets/jerseys/vitoria.webp";
// Série B
import jerseyAmericaMg from "@/assets/jerseys/america-mg.webp";
import jerseyAthletic from "@/assets/jerseys/athletic.webp";
import jerseyAtleticoGo from "@/assets/jerseys/atletico-go.webp";
import jerseyAvai from "@/assets/jerseys/avai.webp";
import jerseyBotafogoSp from "@/assets/jerseys/botafogo-sp.webp";
import jerseyCeara from "@/assets/jerseys/ceara.webp";
import jerseyCrb from "@/assets/jerseys/crb.webp";
import jerseyCriciuma from "@/assets/jerseys/criciuma.webp";
import jerseyCuiaba from "@/assets/jerseys/cuiaba.webp";
import jerseyFortaleza from "@/assets/jerseys/fortaleza.webp";
import jerseyGoias from "@/assets/jerseys/goias.webp";
import jerseyJuventude from "@/assets/jerseys/juventude.webp";
import jerseyLondrina from "@/assets/jerseys/londrina.webp";
import jerseyNautico from "@/assets/jerseys/nautico.webp";
import jerseyNovorizontino from "@/assets/jerseys/novorizontino.webp";
import jerseyOperarioPr from "@/assets/jerseys/operario-pr.webp";
import jerseyPontePreta from "@/assets/jerseys/ponte-preta.webp";
import jerseySaoBernardo from "@/assets/jerseys/sao-bernardo.webp";
import jerseySport from "@/assets/jerseys/sport.webp";
import jerseyVilaNova from "@/assets/jerseys/vila-nova.webp";
// Série C
import jerseyAmazonas from "@/assets/jerseys/amazonas.webp";
import jerseyAnapolis from "@/assets/jerseys/anapolis.webp";
import jerseyBarraSc from "@/assets/jerseys/barra-sc.webp";
import jerseyBotafogoPb from "@/assets/jerseys/botafogo-pb.webp";
import jerseyBrusque from "@/assets/jerseys/brusque.webp";
import jerseyCaxias from "@/assets/jerseys/caxias.webp";
import jerseyConfianca from "@/assets/jerseys/confianca.webp";
import jerseyFerroviaria from "@/assets/jerseys/ferroviaria.webp";
import jerseyFigueirense from "@/assets/jerseys/figueirense.webp";
import jerseyFloresta from "@/assets/jerseys/floresta.webp";
import jerseyGuarani from "@/assets/jerseys/guarani.webp";
import jerseyInterDeLimeira from "@/assets/jerseys/inter-de-limeira.webp";
import jerseyItabaiana from "@/assets/jerseys/itabaiana.webp";
import jerseyItuano from "@/assets/jerseys/ituano.webp";
import jerseyMaranhao from "@/assets/jerseys/maranhao.webp";
import jerseyMaringa from "@/assets/jerseys/maringa.webp";
import jerseyPaysandu from "@/assets/jerseys/paysandu.webp";
import jerseySantaCruz from "@/assets/jerseys/santa-cruz.webp";

const JERSEY_IMAGES: Record<string, string> = {
  "athletico-pr": jerseyAthleticoPr,
  "atletico-mg": jerseyAtleticoMg,
  "bahia": jerseyBahia,
  "botafogo": jerseyBotafogo,
  "bragantino": jerseyBragantino,
  "chapecoense": jerseyChapecoense,
  "corinthians": jerseyCorinthians,
  "coritiba": jerseyCoritiba,
  "cruzeiro": jerseyCruzeiro,
  "flamengo": jerseyFlamengo,
  "fluminense": jerseyFluminense,
  "gremio": jerseyGremio,
  "internacional": jerseyInternacional,
  "mirassol": jerseyMirassol,
  "palmeiras": jerseyPalmeiras,
  "remo": jerseyRemo,
  "santos": jerseySantos,
  "sao-paulo": jerseySaoPaulo,
  "vasco": jerseyVasco,
  "vitoria": jerseyVitoria,
  "america-mg": jerseyAmericaMg,
  "athletic": jerseyAthletic,
  "atletico-go": jerseyAtleticoGo,
  "avai": jerseyAvai,
  "botafogo-sp": jerseyBotafogoSp,
  "ceara": jerseyCeara,
  "crb": jerseyCrb,
  "criciuma": jerseyCriciuma,
  "cuiaba": jerseyCuiaba,
  "fortaleza": jerseyFortaleza,
  "goias": jerseyGoias,
  "juventude": jerseyJuventude,
  "londrina": jerseyLondrina,
  "nautico": jerseyNautico,
  "novorizontino": jerseyNovorizontino,
  "operario-pr": jerseyOperarioPr,
  "ponte-preta": jerseyPontePreta,
  "sao-bernardo": jerseySaoBernardo,
  "sport": jerseySport,
  "vila-nova": jerseyVilaNova,
  "amazonas": jerseyAmazonas,
  "anapolis": jerseyAnapolis,
  "barra-sc": jerseyBarraSc,
  "botafogo-pb": jerseyBotafogoPb,
  "brusque": jerseyBrusque,
  "caxias": jerseyCaxias,
  "confianca": jerseyConfianca,
  "ferroviaria": jerseyFerroviaria,
  "figueirense": jerseyFigueirense,
  "floresta": jerseyFloresta,
  "guarani": jerseyGuarani,
  "inter-de-limeira": jerseyInterDeLimeira,
  "itabaiana": jerseyItabaiana,
  "ituano": jerseyItuano,
  "maranhao": jerseyMaranhao,
  "maringa": jerseyMaringa,
  "paysandu": jerseyPaysandu,
  "santa-cruz": jerseySantaCruz,
};

// 14 pattern types — drawn inside a wavy flag clip path
type PatternId =
  | "vstripe3"
  | "vstripe2"
  | "hstripe3"
  | "hstripe2"
  | "diagonal"
  | "antiDiagonal"
  | "quadrants"
  | "circle"
  | "cross"
  | "saltire"
  | "chevron"
  | "star"
  | "dotGrid"
  | "ring";

const PATTERNS: PatternId[] = [
  "vstripe3",
  "vstripe2",
  "hstripe3",
  "hstripe2",
  "diagonal",
  "antiDiagonal",
  "quadrants",
  "circle",
  "cross",
  "saltire",
  "chevron",
  "star",
  "dotGrid",
  "ring",
];

// Color variants — A is "main", B is "accent"
type ColorVariant = "ab" | "ba" | "aw" | "bw";

const VARIANTS: ColorVariant[] = ["ab", "ba", "aw", "bw"];

interface FlagSpec {
  pattern: PatternId;
  variant: ColorVariant;
}

// Deterministic, collision-free assignment per club.
// Clubs are grouped by their color pair, and within each group we cycle
// (pattern × variant) so two clubs with identical colors never look the same.
const FLAG_MAP: Record<string, FlagSpec> = (() => {
  const usedByColorKey = new Map<string, Set<string>>();
  const usedGlobal = new Set<string>();
  const result: Record<string, FlagSpec> = {};

  // Sorted list keeps assignment stable across reloads.
  const sorted = [...brazilianClubs].sort((a, b) => a.id.localeCompare(b.id));

  for (const club of sorted) {
    const colorKey = `${club.primaryColor.toUpperCase()}|${club.secondaryColor.toUpperCase()}`;
    if (!usedByColorKey.has(colorKey)) usedByColorKey.set(colorKey, new Set());
    const usedHere = usedByColorKey.get(colorKey)!;

    let chosen: FlagSpec | null = null;
    // First pass: avoid any combo used globally for visual diversity.
    outer: for (const variant of VARIANTS) {
      for (const pattern of PATTERNS) {
        const key = `${pattern}|${variant}`;
        if (!usedHere.has(key) && !usedGlobal.has(`${colorKey}|${key}`)) {
          chosen = { pattern, variant };
          break outer;
        }
      }
    }
    // Fallback: at minimum unique within same color group.
    if (!chosen) {
      outer2: for (const variant of VARIANTS) {
        for (const pattern of PATTERNS) {
          const key = `${pattern}|${variant}`;
          if (!usedHere.has(key)) {
            chosen = { pattern, variant };
            break outer2;
          }
        }
      }
    }
    if (!chosen) chosen = { pattern: "vstripe3", variant: "ab" };
    usedHere.add(`${chosen.pattern}|${chosen.variant}`);
    usedGlobal.add(`${colorKey}|${chosen.pattern}|${chosen.variant}`);
    result[club.id] = chosen;
  }
  return result;
})();

const resolveColors = (
  primary: string,
  secondary: string,
  variant: ColorVariant
): { a: string; b: string } => {
  const WHITE = "#FFFFFF";
  switch (variant) {
    case "ab":
      return { a: primary, b: secondary };
    case "ba":
      return { a: secondary, b: primary };
    case "aw":
      return { a: primary, b: WHITE };
    case "bw":
      return { a: secondary, b: WHITE };
  }
};

interface ClubFlagProps {
  clubId: string;
  className?: string;
  /** Optional override for size via class; default fills container */
  rounded?: boolean;
}

const ClubFlag = ({ clubId, className, rounded = false }: ClubFlagProps) => {
  const club = brazilianClubs.find((c) => c.id === clubId);
  if (!club) return null;

  // If we have a custom jersey image for this club, use it instead of the generated flag
  const jersey = JERSEY_IMAGES[clubId];
  if (jersey) {
    return (
      <img
        src={jersey}
        alt={`Camisa ${club.name}`}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className={cn("block w-full h-full object-contain", rounded && "rounded-md", className)}
      />
    );
  }

  const spec = FLAG_MAP[clubId] || { pattern: "vstripe3" as PatternId, variant: "ab" as ColorVariant };
  const { a, b } = resolveColors(club.primaryColor, club.secondaryColor, spec.variant);

  const clipId = `flag-clip-${clubId}`;
  // Wavy flag silhouette — viewBox 200x160
  const wavePath =
    "M2 18 Q 50 2 100 18 T 198 18 L 198 142 Q 150 158 100 142 T 2 142 Z";

  const renderPattern = () => {
    switch (spec.pattern) {
      case "vstripe3":
        return (
          <>
            <rect x="0" y="0" width="66" height="160" fill={a} />
            <rect x="66" y="0" width="68" height="160" fill={b} />
            <rect x="134" y="0" width="66" height="160" fill={a} />
          </>
        );
      case "vstripe2":
        return (
          <>
            <rect x="0" y="0" width="100" height="160" fill={a} />
            <rect x="100" y="0" width="100" height="160" fill={b} />
          </>
        );
      case "hstripe3":
        return (
          <>
            <rect x="0" y="0" width="200" height="54" fill={a} />
            <rect x="0" y="54" width="200" height="52" fill={b} />
            <rect x="0" y="106" width="200" height="54" fill={a} />
          </>
        );
      case "hstripe2":
        return (
          <>
            <rect x="0" y="0" width="200" height="80" fill={a} />
            <rect x="0" y="80" width="200" height="80" fill={b} />
          </>
        );
      case "diagonal":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <polygon points="0,0 200,0 200,160" fill={b} />
          </>
        );
      case "antiDiagonal":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <polygon points="0,0 200,160 0,160" fill={b} />
          </>
        );
      case "quadrants":
        return (
          <>
            <rect x="0" y="0" width="100" height="80" fill={a} />
            <rect x="100" y="0" width="100" height="80" fill={b} />
            <rect x="0" y="80" width="100" height="80" fill={b} />
            <rect x="100" y="80" width="100" height="80" fill={a} />
          </>
        );
      case "circle":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <circle cx="100" cy="80" r="42" fill={b} />
          </>
        );
      case "cross":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <rect x="0" y="65" width="200" height="30" fill={b} />
            <rect x="85" y="0" width="30" height="160" fill={b} />
          </>
        );
      case "saltire":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <line x1="0" y1="0" x2="200" y2="160" stroke={b} strokeWidth="26" />
            <line x1="200" y1="0" x2="0" y2="160" stroke={b} strokeWidth="26" />
          </>
        );
      case "chevron":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <polygon points="0,0 80,80 0,160" fill={b} />
          </>
        );
      case "star":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <polygon
              points="100,32 113,71 154,71 121,95 134,134 100,110 66,134 79,95 46,71 87,71"
              fill={b}
            />
          </>
        );
      case "dotGrid":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <circle cx="60" cy="50" r="16" fill={b} />
            <circle cx="140" cy="50" r="16" fill={b} />
            <circle cx="60" cy="110" r="16" fill={b} />
            <circle cx="140" cy="110" r="16" fill={b} />
          </>
        );
      case "ring":
        return (
          <>
            <rect x="0" y="0" width="200" height="160" fill={a} />
            <circle cx="100" cy="80" r="44" fill="none" stroke={b} strokeWidth="14" />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 200 160"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", rounded && "rounded-md", className)}
      role="img"
      aria-label={`Bandeira ${club.name}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={wavePath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>{renderPattern()}</g>
      <path
        d={wavePath}
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default ClubFlag;