export interface BrazilianState {
  sigla: string;
  nome: string;
}

export const brazilianStates: BrazilianState[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" }
];

export const getAllStates = (): { sigla: string; nome: string }[] => {
  return [...brazilianStates].sort((a, b) => a.nome.localeCompare(b.nome));
};

// Cache to avoid repeated API calls
const citiesCache: Record<string, string[]> = {};

export const getCitiesByState = async (stateSigla: string): Promise<string[]> => {
  if (citiesCache[stateSigla]) {
    return citiesCache[stateSigla];
  }

  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateSigla}/municipios?orderBy=nome`
    );
    if (!response.ok) throw new Error("Failed to fetch cities");
    const data = await response.json();
    const cities = data.map((m: { nome: string }) => m.nome).sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));
    citiesCache[stateSigla] = cities;
    return cities;
  } catch (error) {
    console.error("Error fetching cities from IBGE:", error);
    return [];
  }
};
