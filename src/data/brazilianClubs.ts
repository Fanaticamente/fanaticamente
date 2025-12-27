export interface BrazilianClub {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  badgeUrl: string;
  league: "serie_a" | "serie_b";
}

export const brazilianClubs: BrazilianClub[] = [
  {
    id: "flamengo",
    name: "Flamengo",
    shortName: "FLA",
    primaryColor: "#E32636",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/flamengo/logo-flamengo-256.png",
    league: "serie_a",
  },
  {
    id: "palmeiras",
    name: "Palmeiras",
    shortName: "PAL",
    primaryColor: "#006437",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/palmeiras/logo-palmeiras-256.png",
    league: "serie_a",
  },
  {
    id: "corinthians",
    name: "Corinthians",
    shortName: "COR",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/corinthians/logo-corinthians-256.png",
    league: "serie_a",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    shortName: "SAO",
    primaryColor: "#FF0000",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/sao-paulo/logo-sao-paulo-256.png",
    league: "serie_a",
  },
  {
    id: "fluminense",
    name: "Fluminense",
    shortName: "FLU",
    primaryColor: "#7B2D42",
    secondaryColor: "#006437",
    badgeUrl: "https://logodetimes.com/times/fluminense/logo-fluminense-256.png",
    league: "serie_a",
  },
  {
    id: "botafogo",
    name: "Botafogo",
    shortName: "BOT",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/botafogo/logo-botafogo-256.png",
    league: "serie_a",
  },
  {
    id: "vasco",
    name: "Vasco da Gama",
    shortName: "VAS",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/vasco-da-gama/logo-vasco-da-gama-256.png",
    league: "serie_a",
  },
  {
    id: "atletico-mg",
    name: "Atlético Mineiro",
    shortName: "CAM",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/atletico-mineiro/logo-atletico-mineiro-256.png",
    league: "serie_a",
  },
  {
    id: "cruzeiro",
    name: "Cruzeiro",
    shortName: "CRU",
    primaryColor: "#003DA5",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/cruzeiro/logo-cruzeiro-256.png",
    league: "serie_a",
  },
  {
    id: "internacional",
    name: "Internacional",
    shortName: "INT",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/internacional/logo-internacional-256.png",
    league: "serie_a",
  },
  {
    id: "gremio",
    name: "Grêmio",
    shortName: "GRE",
    primaryColor: "#0A5EB6",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/gremio/logo-gremio-256.png",
    league: "serie_a",
  },
  {
    id: "santos",
    name: "Santos",
    shortName: "SAN",
    primaryColor: "#000000",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/santos/logo-santos-256.png",
    league: "serie_a",
  },
  {
    id: "athletico-pr",
    name: "Athletico Paranaense",
    shortName: "CAP",
    primaryColor: "#E30613",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/athletico-paranaense/logo-athletico-paranaense-256.png",
    league: "serie_a",
  },
  {
    id: "bahia",
    name: "Bahia",
    shortName: "BAH",
    primaryColor: "#004A99",
    secondaryColor: "#E30613",
    badgeUrl: "https://logodetimes.com/times/bahia/logo-bahia-256.png",
    league: "serie_a",
  },
  {
    id: "fortaleza",
    name: "Fortaleza",
    shortName: "FOR",
    primaryColor: "#004A99",
    secondaryColor: "#E30613",
    badgeUrl: "https://logodetimes.com/times/fortaleza/logo-fortaleza-256.png",
    league: "serie_a",
  },
  {
    id: "bragantino",
    name: "Red Bull Bragantino",
    shortName: "RBB",
    primaryColor: "#E30613",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/red-bull-bragantino/logo-red-bull-bragantino-256.png",
    league: "serie_a",
  },
  {
    id: "cuiaba",
    name: "Cuiabá",
    shortName: "CUI",
    primaryColor: "#006437",
    secondaryColor: "#FFD700",
    badgeUrl: "https://logodetimes.com/times/cuiaba/logo-cuiaba-256.png",
    league: "serie_a",
  },
  {
    id: "juventude",
    name: "Juventude",
    shortName: "JUV",
    primaryColor: "#006437",
    secondaryColor: "#FFFFFF",
    badgeUrl: "https://logodetimes.com/times/juventude/logo-juventude-256.png",
    league: "serie_a",
  },
  {
    id: "criciuma",
    name: "Criciúma",
    shortName: "CRI",
    primaryColor: "#FFD700",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/criciuma/logo-criciuma-256.png",
    league: "serie_a",
  },
  {
    id: "vitoria",
    name: "Vitória",
    shortName: "VIT",
    primaryColor: "#E30613",
    secondaryColor: "#000000",
    badgeUrl: "https://logodetimes.com/times/vitoria/logo-vitoria-256.png",
    league: "serie_a",
  },
];

export const getClubById = (id: string): BrazilianClub | undefined => {
  return brazilianClubs.find((club) => club.id === id);
};

export const getClubsByLeague = (league: "serie_a" | "serie_b"): BrazilianClub[] => {
  return brazilianClubs.filter((club) => club.league === league);
};
