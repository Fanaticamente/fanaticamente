export interface BrazilianState {
  sigla: string;
  nome: string;
  cidades: string[];
}

export const brazilianStates: BrazilianState[] = [
  {
    sigla: "AC",
    nome: "Acre",
    cidades: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó", "Brasiléia", "Senador Guiomard", "Plácido de Castro", "Xapuri", "Epitaciolândia"]
  },
  {
    sigla: "AL",
    nome: "Alagoas",
    cidades: ["Maceió", "Arapiraca", "Rio Largo", "Palmeira dos Índios", "União dos Palmares", "Penedo", "São Miguel dos Campos", "Santana do Ipanema", "Coruripe", "Delmiro Gouveia"]
  },
  {
    sigla: "AP",
    nome: "Amapá",
    cidades: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Mazagão", "Porto Grande", "Tartarugalzinho", "Vitória do Jari", "Calçoene", "Amapá"]
  },
  {
    sigla: "AM",
    nome: "Amazonas",
    cidades: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tefé", "Maués", "Tabatinga", "São Gabriel da Cachoeira", "Humaitá"]
  },
  {
    sigla: "BA",
    nome: "Bahia",
    cidades: ["Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Ilhéus", "Jequié", "Teixeira de Freitas", "Barreiras", "Alagoinhas", "Porto Seguro", "Simões Filho", "Paulo Afonso"]
  },
  {
    sigla: "CE",
    nome: "Ceará",
    cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá", "Pacatuba", "Aquiraz", "Russas", "Canindé", "Aracati"]
  },
  {
    sigla: "DF",
    nome: "Distrito Federal",
    cidades: ["Brasília", "Ceilândia", "Taguatinga", "Samambaia", "Plano Piloto", "Águas Claras", "Recanto das Emas", "Gama", "Guará", "Santa Maria"]
  },
  {
    sigla: "ES",
    nome: "Espírito Santo",
    cidades: ["Vitória", "Vila Velha", "Serra", "Cariacica", "Cachoeiro de Itapemirim", "Linhares", "Colatina", "Guarapari", "São Mateus", "Aracruz"]
  },
  {
    sigla: "GO",
    nome: "Goiás",
    cidades: ["Goiânia", "Aparecida de Goiânia", "Anápolis", "Rio Verde", "Luziânia", "Águas Lindas de Goiás", "Valparaíso de Goiás", "Trindade", "Formosa", "Novo Gama", "Itumbiara", "Senador Canedo", "Catalão", "Jataí", "Planaltina"]
  },
  {
    sigla: "MA",
    nome: "Maranhão",
    cidades: ["São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias", "Codó", "Paço do Lumiar", "Açailândia", "Bacabal", "Balsas"]
  },
  {
    sigla: "MT",
    nome: "Mato Grosso",
    cidades: ["Cuiabá", "Várzea Grande", "Rondonópolis", "Sinop", "Tangará da Serra", "Cáceres", "Sorriso", "Lucas do Rio Verde", "Primavera do Leste", "Barra do Garças"]
  },
  {
    sigla: "MS",
    nome: "Mato Grosso do Sul",
    cidades: ["Campo Grande", "Dourados", "Três Lagoas", "Corumbá", "Ponta Porã", "Naviraí", "Nova Andradina", "Aquidauana", "Sidrolândia", "Paranaíba"]
  },
  {
    sigla: "MG",
    nome: "Minas Gerais",
    cidades: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Sete Lagoas", "Divinópolis", "Santa Luzia", "Poços de Caldas", "Patos de Minas"]
  },
  {
    sigla: "PA",
    nome: "Pará",
    cidades: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Marituba", "Cametá", "Bragança", "Altamira", "Barcarena", "Tailândia", "Tucuruí", "Itaituba"]
  },
  {
    sigla: "PB",
    nome: "Paraíba",
    cidades: ["João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa", "Cabedelo", "Cajazeiras", "Guarabira", "Sapé"]
  },
  {
    sigla: "PR",
    nome: "Paraná",
    cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Araucária", "Toledo", "Apucarana", "Pinhais", "Campo Largo"]
  },
  {
    sigla: "PE",
    nome: "Pernambuco",
    cidades: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão"]
  },
  {
    sigla: "PI",
    nome: "Piauí",
    cidades: ["Teresina", "Parnaíba", "Picos", "Piripiri", "Floriano", "Campo Maior", "Barras", "União", "Altos", "José de Freitas"]
  },
  {
    sigla: "RJ",
    nome: "Rio de Janeiro",
    cidades: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes", "São João de Meriti", "Petrópolis", "Volta Redonda", "Magé", "Itaboraí", "Macaé", "Mesquita", "Nilópolis"]
  },
  {
    sigla: "RN",
    nome: "Rio Grande do Norte",
    cidades: ["Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba", "Ceará-Mirim", "Caicó", "Açu", "Currais Novos", "São José de Mipibu"]
  },
  {
    sigla: "RS",
    nome: "Rio Grande do Sul",
    cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Sapucaia do Sul", "Uruguaiana", "Santa Cruz do Sul"]
  },
  {
    sigla: "RO",
    nome: "Rondônia",
    cidades: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Rolim de Moura", "Jaru", "Guajará-Mirim", "Ouro Preto do Oeste", "Pimenta Bueno"]
  },
  {
    sigla: "RR",
    nome: "Roraima",
    cidades: ["Boa Vista", "Rorainópolis", "Caracaraí", "Alto Alegre", "Mucajaí", "Cantá", "Bonfim", "Pacaraima", "Amajari", "Iracema"]
  },
  {
    sigla: "SC",
    nome: "Santa Catarina",
    cidades: ["Florianópolis", "Joinville", "Blumenau", "São José", "Chapecó", "Criciúma", "Itajaí", "Jaraguá do Sul", "Palhoça", "Lages", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Caçador"]
  },
  {
    sigla: "SP",
    nome: "São Paulo",
    cidades: ["São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Ribeirão Preto", "Osasco", "Sorocaba", "Mauá", "São José dos Campos", "Mogi das Cruzes", "Santos", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "São José do Rio Preto", "Itaquaquecetuba", "Franca"]
  },
  {
    sigla: "SE",
    nome: "Sergipe",
    cidades: ["Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana", "São Cristóvão", "Estância", "Tobias Barreto", "Itabaianinha", "Simão Dias", "Capela"]
  },
  {
    sigla: "TO",
    nome: "Tocantins",
    cidades: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Colinas do Tocantins", "Guaraí", "Tocantinópolis", "Dianópolis", "Miracema do Tocantins"]
  }
];

export const getAllStates = (): { sigla: string; nome: string }[] => {
  return brazilianStates.map(s => ({ sigla: s.sigla, nome: s.nome })).sort((a, b) => a.nome.localeCompare(b.nome));
};

export const getCitiesByState = (stateSigla: string): string[] => {
  const state = brazilianStates.find(s => s.sigla === stateSigla);
  return state ? state.cidades.sort((a, b) => a.localeCompare(b)) : [];
};
