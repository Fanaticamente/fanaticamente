export interface BrazilianClub {
  id: string;
  name: string;
  state: string;
  league: "serie_a" | "serie_b" | "serie_c" | "serie_d";
}

// Clubes do Campeonato Brasileiro 2025 - Séries A, B, C e D (ordem alfabética)
export const allBrazilianClubs: BrazilianClub[] = ([
  // Série A - 2025
  { id: "america-mg", name: "América-MG", state: "MG", league: "serie_a" },
  { id: "atletico-mg", name: "Atlético Mineiro", state: "MG", league: "serie_a" },
  { id: "athletico-pr", name: "Athletico Paranaense", state: "PR", league: "serie_a" },
  { id: "bahia", name: "Bahia", state: "BA", league: "serie_a" },
  { id: "botafogo", name: "Botafogo", state: "RJ", league: "serie_a" },
  { id: "bragantino", name: "Red Bull Bragantino", state: "SP", league: "serie_a" },
  { id: "corinthians", name: "Corinthians", state: "SP", league: "serie_a" },
  { id: "cruzeiro", name: "Cruzeiro", state: "MG", league: "serie_a" },
  { id: "cuiaba", name: "Cuiabá", state: "MT", league: "serie_a" },
  { id: "flamengo", name: "Flamengo", state: "RJ", league: "serie_a" },
  { id: "fluminense", name: "Fluminense", state: "RJ", league: "serie_a" },
  { id: "fortaleza", name: "Fortaleza", state: "CE", league: "serie_a" },
  { id: "gremio", name: "Grêmio", state: "RS", league: "serie_a" },
  { id: "internacional", name: "Internacional", state: "RS", league: "serie_a" },
  { id: "juventude", name: "Juventude", state: "RS", league: "serie_a" },
  { id: "palmeiras", name: "Palmeiras", state: "SP", league: "serie_a" },
  { id: "santos", name: "Santos", state: "SP", league: "serie_a" },
  { id: "sao-paulo", name: "São Paulo", state: "SP", league: "serie_a" },
  { id: "vasco", name: "Vasco da Gama", state: "RJ", league: "serie_a" },
  { id: "vitoria", name: "Vitória", state: "BA", league: "serie_a" },

  // Série B - 2025
  { id: "amazonas", name: "Amazonas", state: "AM", league: "serie_b" },
  { id: "avai", name: "Avaí", state: "SC", league: "serie_b" },
  { id: "botafogo-sp", name: "Botafogo-SP", state: "SP", league: "serie_b" },
  { id: "brusque", name: "Brusque", state: "SC", league: "serie_b" },
  { id: "ceara", name: "Ceará", state: "CE", league: "serie_b" },
  { id: "chapecoense", name: "Chapecoense", state: "SC", league: "serie_b" },
  { id: "coritiba", name: "Coritiba", state: "PR", league: "serie_b" },
  { id: "criciuma", name: "Criciúma", state: "SC", league: "serie_b" },
  { id: "goias", name: "Goiás", state: "GO", league: "serie_b" },
  { id: "guarani", name: "Guarani", state: "SP", league: "serie_b" },
  { id: "ituano", name: "Ituano", state: "SP", league: "serie_b" },
  { id: "mirassol", name: "Mirassol", state: "SP", league: "serie_b" },
  { id: "novorizontino", name: "Novorizontino", state: "SP", league: "serie_b" },
  { id: "operario-pr", name: "Operário-PR", state: "PR", league: "serie_b" },
  { id: "paysandu", name: "Paysandu", state: "PA", league: "serie_b" },
  { id: "ponte-preta", name: "Ponte Preta", state: "SP", league: "serie_b" },
  { id: "sport", name: "Sport", state: "PE", league: "serie_b" },
  { id: "vila-nova", name: "Vila Nova", state: "GO", league: "serie_b" },

  // Série C - 2025
  { id: "abc", name: "ABC", state: "RN", league: "serie_c" },
  { id: "aparecidense", name: "Aparecidense", state: "GO", league: "serie_c" },
  { id: "athletic", name: "Athletic Club", state: "MG", league: "serie_c" },
  { id: "barra-sc", name: "Barra-SC", state: "SC", league: "serie_c" },
  { id: "botafogo-pb", name: "Botafogo-PB", state: "PB", league: "serie_c" },
  { id: "caxias", name: "Caxias", state: "RS", league: "serie_c" },
  { id: "confianca", name: "Confiança", state: "SE", league: "serie_c" },
  { id: "csa", name: "CSA", state: "AL", league: "serie_c" },
  { id: "ferroviaria", name: "Ferroviária", state: "SP", league: "serie_c" },
  { id: "figueirense", name: "Figueirense", state: "SC", league: "serie_c" },
  { id: "floresta", name: "Floresta", state: "CE", league: "serie_c" },
  { id: "londrina", name: "Londrina", state: "PR", league: "serie_c" },
  { id: "nautico", name: "Náutico", state: "PE", league: "serie_c" },
  { id: "remo", name: "Remo", state: "PA", league: "serie_c" },
  { id: "sampaio-correa", name: "Sampaio Corrêa", state: "MA", league: "serie_c" },
  { id: "sao-bernardo", name: "São Bernardo", state: "SP", league: "serie_c" },
  { id: "tombense", name: "Tombense", state: "MG", league: "serie_c" },
  { id: "volta-redonda", name: "Volta Redonda", state: "RJ", league: "serie_c" },
  { id: "ypiranga-rs", name: "Ypiranga-RS", state: "RS", league: "serie_c" },

  // Série D - 2025 (principais clubes)
  { id: "aimore", name: "Aimoré", state: "RS", league: "serie_d" },
  { id: "altos", name: "Altos", state: "PI", league: "serie_d" },
  { id: "america-rn", name: "América-RN", state: "RN", league: "serie_d" },
  { id: "anapolis", name: "Anápolis", state: "GO", league: "serie_d" },
  { id: "agua-santa", name: "Água Santa", state: "SP", league: "serie_d" },
  { id: "atletico-go", name: "Atlético-GO", state: "GO", league: "serie_d" },
  { id: "audax-rj", name: "Audax Rio", state: "RJ", league: "serie_d" },
  { id: "azuriz", name: "Azuriz", state: "PR", league: "serie_d" },
  { id: "barcelona-ro", name: "Barcelona-RO", state: "RO", league: "serie_d" },
  { id: "boavista", name: "Boavista", state: "RJ", league: "serie_d" },
  { id: "brasiliense", name: "Brasiliense", state: "DF", league: "serie_d" },
  { id: "caldense", name: "Caldense", state: "MG", league: "serie_d" },
  { id: "campinense", name: "Campinense", state: "PB", league: "serie_d" },
  { id: "capital-df", name: "Capital-DF", state: "DF", league: "serie_d" },
  { id: "castanhal", name: "Castanhal", state: "PA", league: "serie_d" },
  { id: "crac", name: "CRAC", state: "GO", league: "serie_d" },
  { id: "ecjuventudeam", name: "EC Juventude-AM", state: "AM", league: "serie_d" },
  { id: "fast", name: "Fast Clube", state: "AM", league: "serie_d" },
  { id: "fluminense-pi", name: "Fluminense-PI", state: "PI", league: "serie_d" },
  { id: "gama", name: "Gama", state: "DF", league: "serie_d" },
  { id: "globo-rn", name: "Globo-RN", state: "RN", league: "serie_d" },
  { id: "hercilio-luz", name: "Hercílio Luz", state: "SC", league: "serie_d" },
  { id: "ipora", name: "Iporá", state: "GO", league: "serie_d" },
  { id: "itabaiana", name: "Itabaiana", state: "SE", league: "serie_d" },
  { id: "jacuipense", name: "Jacuipense", state: "BA", league: "serie_d" },
  { id: "jaragua", name: "Jaraguá", state: "GO", league: "serie_d" },
  { id: "juazeirense", name: "Juazeirense", state: "BA", league: "serie_d" },
  { id: "manaus", name: "Manaus FC", state: "AM", league: "serie_d" },
  { id: "moto-club", name: "Moto Club", state: "MA", league: "serie_d" },
  { id: "nova-iguacu", name: "Nova Iguaçu", state: "RJ", league: "serie_d" },
  { id: "patrocinense", name: "Patrocinense", state: "MG", league: "serie_d" },
  { id: "pouso-alegre", name: "Pouso Alegre", state: "MG", league: "serie_d" },
  { id: "princesa-do-solimoes", name: "Princesa do Solimões", state: "AM", league: "serie_d" },
  { id: "real-brasilia", name: "Real Brasília", state: "DF", league: "serie_d" },
  { id: "retrô", name: "Retrô", state: "PE", league: "serie_d" },
  { id: "rio-branco-ac", name: "Rio Branco-AC", state: "AC", league: "serie_d" },
  { id: "santa-cruz", name: "Santa Cruz", state: "PE", league: "serie_d" },
  { id: "sergipe", name: "Sergipe", state: "SE", league: "serie_d" },
  { id: "sousa", name: "Sousa", state: "PB", league: "serie_d" },
  { id: "trem-ap", name: "Trem-AP", state: "AP", league: "serie_d" },
  { id: "treze", name: "Treze", state: "PB", league: "serie_d" },
  { id: "uberlandia", name: "Uberlândia", state: "MG", league: "serie_d" },
] as BrazilianClub[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

export const getClubsByLeague = (league: "serie_a" | "serie_b" | "serie_c" | "serie_d"): BrazilianClub[] => {
  return allBrazilianClubs.filter(club => club.league === league);
};

export const getAllClubsSorted = (): BrazilianClub[] => {
  return [...allBrazilianClubs].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
};

export const getLeagueLabel = (league: string): string => {
  const labels: Record<string, string> = {
    serie_a: "Série A",
    serie_b: "Série B",
    serie_c: "Série C",
    serie_d: "Série D"
  };
  return labels[league] || league;
};
