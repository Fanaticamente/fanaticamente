/**
 * Fix title capitalization for Portuguese news titles.
 * Ensures first letter is uppercase and proper nouns are correctly capitalized.
 */
export function fixTitleCapitalization(title: string): string {
  if (!title || title.length === 0) return title;

  const properNouns: Record<string, string> = {
    'flamengo': 'Flamengo', 'corinthians': 'Corinthians', 'palmeiras': 'Palmeiras',
    'santos': 'Santos', 'vasco': 'Vasco', 'botafogo': 'Botafogo', 'fluminense': 'Fluminense',
    'grêmio': 'Grêmio', 'gremio': 'Grêmio', 'internacional': 'Internacional',
    'atlético-mg': 'Atlético-MG', 'atletico-mg': 'Atlético-MG', 'cruzeiro': 'Cruzeiro',
    'bahia': 'Bahia', 'fortaleza': 'Fortaleza', 'ceará': 'Ceará', 'ceara': 'Ceará',
    'sport': 'Sport', 'vitória': 'Vitória', 'vitoria': 'Vitória',
    'athletico-pr': 'Athletico-PR', 'athletico': 'Athletico', 'coritiba': 'Coritiba',
    'bragantino': 'Bragantino', 'mirassol': 'Mirassol', 'remo': 'Remo',
    'são paulo': 'São Paulo', 'sao paulo': 'São Paulo', 'são-paulo': 'São Paulo',
    'chapecoense': 'Chapecoense', 'juventude': 'Juventude', 'cuiabá': 'Cuiabá', 'cuiaba': 'Cuiabá',
    'goiás': 'Goiás', 'goias': 'Goiás', 'américa-mg': 'América-MG', 'america-mg': 'América-MG',
    'atlético-go': 'Atlético-GO', 'atletico-go': 'Atlético-GO',
    'criciúma': 'Criciúma', 'criciuma': 'Criciúma', 'novorizontino': 'Novorizontino',
    'vila nova': 'Vila Nova', 'ponte preta': 'Ponte Preta', 'operário-pr': 'Operário-PR',
    'londrina': 'Londrina', 'náutico': 'Náutico', 'nautico': 'Náutico',
    'avaí': 'Avaí', 'avai': 'Avaí', 'botafogo-sp': 'Botafogo-SP',
    'são bernardo': 'São Bernardo', 'sao bernardo': 'São Bernardo',
    'brasileirão': 'Brasileirão', 'brasileirao': 'Brasileirão',
    'libertadores': 'Libertadores', 'sul-americana': 'Sul-Americana',
    'copa do brasil': 'Copa do Brasil', 'série a': 'Série A', 'serie a': 'Série A',
    'série b': 'Série B', 'serie b': 'Série B',
    'champions league': 'Champions League', 'premier league': 'Premier League',
    'la liga': 'La Liga', 'copa américa': 'Copa América',
    'real madrid': 'Real Madrid', 'barcelona': 'Barcelona', 'manchester': 'Manchester',
    'shakhtar': 'Shakhtar', 'conmebol': 'CONMEBOL', 'cbf': 'CBF', 'fifa': 'FIFA',
    'var': 'VAR', 'crb': 'CRB',
  };

  // First letter uppercase
  let fixed = title.charAt(0).toUpperCase() + title.slice(1);

  // Sort by length descending so longer matches take priority
  const sortedEntries = Object.entries(properNouns).sort((a, b) => b[0].length - a[0].length);

  for (const [lower, correct] of sortedEntries) {
    const escaped = lower.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    fixed = fixed.replace(regex, correct);
  }

  // Capitalize first letter after ": " or ". "
  fixed = fixed.replace(/([:.])\s+([a-záàâãéèêíïóôõöúç])/g, (_, punct, letter) => {
    return `${punct} ${letter.toUpperCase()}`;
  });

  return fixed;
}
