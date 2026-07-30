export interface ResenhaOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface ResenhaQuestion {
  id: number;
  scenario: string;
  options: ResenhaOption[];
}

export type ResenhaTopicKey = "trabalho" | "relacionamento" | "familia";

export const elesTrabalho: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Tenho passado horas nas redes sociais discutindo sobre futebol durante o expediente, e isso está atrasando minhas tarefas.",
    options: [
      { id: "a", text: "Continue discutindo futebol, o trabalho pode esperar!", isCorrect: false, feedback: "Reforça a ideia de que a emoção do momento vale mais do que as responsabilidades. Tende a gerar acúmulo de tarefas, estresse e impacto na imagem profissional." },
      { id: "b", text: "Talvez seja melhor parar de usar as redes sociais de vez.", isCorrect: false, feedback: "Reação radical. Ignora a dificuldade real de equilíbrio e pode gerar frustração ou efeito rebote." },
      { id: "c", text: "Que tal estabelecer horários específicos fora do expediente para discutir futebol?", isCorrect: true, feedback: "Sugere organização e limite: reconhece a importância do futebol, mas separa lazer e trabalho, favorecendo foco e responsabilidade." },
    ],
  },
  {
    id: 2,
    scenario: "Fiquei batendo boca sobre o jogo no grupo do trabalho e o clima ficou estranho depois.",
    options: [
      { id: "a", text: "Quem não aguenta zoeira que peça demissão.", isCorrect: false, feedback: "Reforça postura de confronto e desconsidera o ambiente profissional, gerando desgaste nas relações." },
      { id: "b", text: "Vou sair de todos os grupos e pronto.", isCorrect: false, feedback: "Reação radical que evita o problema sem resolvê-lo e prejudica integração e comunicação." },
      { id: "c", text: "Talvez seja melhor separar resenha de ambiente profissional.", isCorrect: true, feedback: "Propõe separar espaços e contextos, adequando a resenha ao ambiente para preservar o clima de trabalho." },
    ],
  },
  {
    id: 3,
    scenario: "Depois que meu time perdeu, fiquei sem foco nenhum no serviço.",
    options: [
      { id: "a", text: "Normal, ninguém trabalha direito depois de uma derrota dessas.", isCorrect: false, feedback: "Normaliza a perda de rendimento como inevitável, reforçando a falta de responsabilidade sobre o próprio desempenho." },
      { id: "b", text: "Melhor eu nem ir trabalhar quando tem jogo importante.", isCorrect: false, feedback: "Evita o enfrentamento do desafio: afastar-se não ensina a lidar com frustração." },
      { id: "c", text: "Talvez eu precise criar um jeito de virar a chave quando começa o expediente.", isCorrect: true, feedback: "Incentiva autorregulação, separando a emoção do jogo das obrigações profissionais." },
    ],
  },
  {
    id: 4,
    scenario: "Já discuti feio com colega por causa de rivalidade.",
    options: [
      { id: "a", text: "Rival é rival em qualquer lugar.", isCorrect: false, feedback: "Leva a rivalidade esportiva para o campo pessoal, ampliando conflitos no ambiente profissional." },
      { id: "b", text: "Ele começou, só respondi.", isCorrect: false, feedback: "Transfere responsabilidade para o outro, evitando refletir sobre a própria postura." },
      { id: "c", text: "Posso brincar sem deixar virar ataque pessoal.", isCorrect: true, feedback: "Reconhece que é possível manter a brincadeira sem transformar rivalidade em ataque pessoal." },
    ],
  },
  {
    id: 5,
    scenario: "Fico atualizando site de esportes/bets toda hora no trabalho.",
    options: [
      { id: "a", text: "Informação/apostas são prioridades!", isCorrect: false, feedback: "Prioriza o interesse pessoal acima das responsabilidades, afetando produtividade e percepção profissional." },
      { id: "b", text: "Melhor bloquear tudo e nunca mais ver nada.", isCorrect: false, feedback: "Solução extrema que gera sensação de privação sem resolver o problema de equilíbrio." },
      { id: "c", text: "Talvez eu possa definir pausas rápidas pra isso e manter o foco no resto do tempo.", isCorrect: true, feedback: "Sugere organização e limites claros, equilibrando interesse por futebol com foco nas tarefas." },
    ],
  },
  {
    id: 6,
    scenario: "Meu chefe já comentou que eu me empolgo demais falando de futebol.",
    options: [
      { id: "a", text: "Ele não entende o que é paixão.", isCorrect: false, feedback: "Desconsidera o contexto profissional e invalida o feedback recebido." },
      { id: "b", text: "Vou parar de falar de futebol pra sempre.", isCorrect: false, feedback: "Reage com o extremo oposto, eliminando completamente o assunto de forma desproporcional." },
      { id: "c", text: "Talvez eu precise dosar o assunto dependendo do ambiente.", isCorrect: true, feedback: "Propõe ajuste de comportamento conforme o ambiente, preservando autenticidade sem perder profissionalismo." },
    ],
  },
  {
    id: 7,
    scenario: "Quando zoam meu time no trabalho, eu levo pro pessoal.",
    options: [
      { id: "a", text: "Falou do meu time, falou de mim.", isCorrect: false, feedback: "Associa clube à identidade pessoal, tornando qualquer comentário uma afronta direta." },
      { id: "b", text: "Melhor cortar amizade ali mesmo.", isCorrect: false, feedback: "Rompe vínculos por algo circunstancial, ampliando o conflito." },
      { id: "c", text: "Talvez eu possa entrar na brincadeira sem transformar em confronto.", isCorrect: true, feedback: "Sugere entrar na brincadeira com leveza, mantendo relações saudáveis diante de provocações." },
    ],
  },
  {
    id: 8,
    scenario: "Depois de derrota, fico sem vontade nenhuma de produzir.",
    options: [
      { id: "a", text: "Normal, ninguém rende depois de um 3x0.", isCorrect: false, feedback: "Naturaliza a queda de rendimento, reduzindo a percepção de responsabilidade sobre o desempenho." },
      { id: "b", text: "Melhor nem falar comigo nesses dias.", isCorrect: false, feedback: "Cria ambiente de tensão ao redor, afastando colegas em vez de buscar equilíbrio." },
      { id: "c", text: "Talvez eu precise criar um jeito de virar a chave.", isCorrect: true, feedback: "Indica a necessidade de mecanismos internos para separar emoção esportiva da vida profissional." },
    ],
  },
  {
    id: 9,
    scenario: "Meu chefe pediu mais foco depois de semana decisiva.",
    options: [
      { id: "a", text: "Ele não entende o que é Libertadores.", isCorrect: false, feedback: "Desvaloriza a cobrança profissional ao priorizar o campeonato, afetando credibilidade." },
      { id: "b", text: "Exagero dele.", isCorrect: false, feedback: "Minimiza o feedback recebido, dificultando crescimento e melhoria." },
      { id: "c", text: "Talvez eu precise mostrar equilíbrio.", isCorrect: true, feedback: "Reconhece a importância de demonstrar equilíbrio diante das expectativas profissionais." },
    ],
  },
  {
    id: 10,
    scenario: "Fico ansioso demais no dia de jogo e não rendo nada.",
    options: [
      { id: "a", text: "Futebol mexe comigo mesmo.", isCorrect: false, feedback: "Aceita a ansiedade como imutável, sem buscar alternativas para lidar melhor com ela." },
      { id: "b", text: "Ansiedade faz parte.", isCorrect: false, feedback: "Normaliza o impacto negativo sem propor mudança ou estratégia." },
      { id: "c", text: "Talvez eu possa criar estratégias pra controlar isso.", isCorrect: true, feedback: "Aponta para o desenvolvimento de estratégias de controle emocional, fortalecendo desempenho e bem-estar." },
    ],
  },
  {
    id: 11,
    scenario: "Quando meu time ganha, fico provocando geral no escritório.",
    options: [
      { id: "a", text: "Tem que aproveitar.", isCorrect: false, feedback: "Coloca a euforia acima da convivência, podendo gerar desgaste nas relações." },
      { id: "b", text: "Quem perdeu que aguente.", isCorrect: false, feedback: "Ignora o impacto da provocação no outro, reforçando postura pouco empática." },
      { id: "c", text: "Talvez eu possa comemorar sem humilhar.", isCorrect: true, feedback: "Sugere comemorar com respeito, mantendo o clima leve e saudável." },
    ],
  },
  {
    id: 12,
    scenario: "Percebo que escuto pouco e só espero minha vez de rebater.",
    options: [
      { id: "a", text: "Debate é isso.", isCorrect: false, feedback: "Reduz o diálogo a uma disputa, dificultando escuta e colaboração." },
      { id: "b", text: "Se eu não falar, ninguém fala.", isCorrect: false, feedback: "Reforça a centralização da conversa, limitando uma troca verdadeira." },
      { id: "c", text: "Talvez ouvir melhore até o respeito no trabalho.", isCorrect: true, feedback: "Reconhece que a escuta consciente fortalece o respeito e melhora relações profissionais." },
    ],
  },
];

export const elesRelacionamento: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Ela reclama que eu exagero na bebida vendo jogo e depois fico chato.",
    options: [
      { id: "a", text: "Futebol e cerveja andam juntos, sempre foi assim.", isCorrect: false, feedback: "Normaliza o excesso como parte obrigatória do ritual do jogo, sem considerar impactos na relação." },
      { id: "b", text: "Ela que aprenda a lidar com isso.", isCorrect: false, feedback: "Transfere a responsabilidade para a parceira, enfraquecendo o diálogo." },
      { id: "c", text: "Talvez moderar ajude a evitar discussão e manter o clima leve.", isCorrect: true, feedback: "Aponta para moderação e autocontrole, equilibrando o jogo e o clima da relação." },
    ],
  },
  {
    id: 2,
    scenario: "Já deixei de sair com ela porque tinha rodada importante.",
    options: [
      { id: "a", text: "Prioridades são prioridades.", isCorrect: false, feedback: "Coloca o campeonato como prioridade absoluta, gerando sensação de desvalorização." },
      { id: "b", text: "Ela devia torcer pro mesmo time.", isCorrect: false, feedback: "Desvia a responsabilidade para a outra pessoa em vez de refletir sobre escolhas." },
      { id: "c", text: "Talvez eu possa equilibrar agenda e não transformar toda rodada em “final de Copa”.", isCorrect: true, feedback: "Sugere organização e proporcionalidade, evitando transformar toda rodada em evento inadiável." },
    ],
  },
  {
    id: 3,
    scenario: "Ela diz que eu não escuto quando fala durante o jogo.",
    options: [
      { id: "a", text: "Claro que não, tô vendo o lance!", isCorrect: false, feedback: "Ignora a necessidade de atenção da outra pessoa, priorizando totalmente a partida." },
      { id: "b", text: "Fala no intervalo e pronto.", isCorrect: false, feedback: "Adia constantemente a escuta, gerando sensação de desinteresse." },
      { id: "c", text: "Talvez eu possa pausar, ouvir e depois voltar pro jogo.", isCorrect: true, feedback: "Propõe equilíbrio simples e prático: ouvir com atenção e depois retomar o jogo." },
    ],
  },
  {
    id: 4,
    scenario: "Depois da derrota, desconto meu mau humor nela.",
    options: [
      { id: "a", text: "Melhor nem falar comigo depois do jogo.", isCorrect: false, feedback: "Normaliza o afastamento e cria clima de tensão, sem responsabilização emocional." },
      { id: "b", text: "Ela já sabe como eu sou.", isCorrect: false, feedback: "Justifica o comportamento como traço fixo, dificultando mudança." },
      { id: "c", text: "Talvez eu precise de um tempo pra esfriar antes de conversar.", isCorrect: true, feedback: "Reconhece a necessidade de pausa e autorregulação antes de conversar." },
    ],
  },
  {
    id: 5,
    scenario: "Ela diz que às vezes parece que eu amo mais o time do que ela.",
    options: [
      { id: "a", text: "Time é pra vida toda.", isCorrect: false, feedback: "Reforça a hierarquização do time acima da relação, gerando insegurança afetiva." },
      { id: "b", text: "Ela tá exagerando demais.", isCorrect: false, feedback: "Desqualifica o sentimento da parceira, fechando espaço para diálogo." },
      { id: "c", text: "Talvez eu precise demonstrar mais presença e equilíbrio.", isCorrect: true, feedback: "Sugere maior demonstração de presença e equilíbrio emocional." },
    ],
  },
  {
    id: 6,
    scenario: "Já troquei programa a dois por rodada do campeonato.",
    options: [
      { id: "a", text: "Rodada é sagrada.", isCorrect: false, feedback: "Prioriza o evento esportivo automaticamente, sem avaliar contexto." },
      { id: "b", text: "Programa a gente faz outro dia.", isCorrect: false, feedback: "Minimiza o impacto da troca, como se não houvesse frustração envolvida." },
      { id: "c", text: "Talvez equilíbrio seja o caminho.", isCorrect: true, feedback: "Indica busca por equilíbrio entre agenda pessoal e relacionamento." },
    ],
  },
  {
    id: 7,
    scenario: "Ela diz que eu me sinto pessoalmente ofendido quando criticam o time.",
    options: [
      { id: "a", text: "Porque é pessoal mesmo.", isCorrect: false, feedback: "Confunde identidade pessoal com clube, tornando qualquer crítica um ataque direto." },
      { id: "b", text: "Estão me provocando.", isCorrect: false, feedback: "Parte do pressuposto de provocação constante, mantendo postura defensiva." },
      { id: "c", text: "Talvez eu precise separar identidade de clube.", isCorrect: true, feedback: "Propõe separar identidade individual da paixão esportiva." },
    ],
  },
  {
    id: 8,
    scenario: "Já ignorei conversa importante porque estava vendo coletiva.",
    options: [
      { id: "a", text: "Coletiva é essencial.", isCorrect: false, feedback: "Prioriza informação esportiva sobre diálogo significativo." },
      { id: "b", text: "Depois ela fala de novo.", isCorrect: false, feedback: "Adia assunto relevante, podendo gerar frustração acumulada." },
      { id: "c", text: "Talvez eu precise priorizar o momento.", isCorrect: true, feedback: "Reconhece a importância de priorizar o momento e a pessoa presente." },
    ],
  },
  {
    id: 9,
    scenario: "Quando ela critica meu comportamento no jogo, eu rebato na hora.",
    options: [
      { id: "a", text: "Não aceito crítica.", isCorrect: false, feedback: "Rejeita qualquer crítica automaticamente, dificultando crescimento." },
      { id: "b", text: "Ela não entende futebol.", isCorrect: false, feedback: "Desqualifica a opinião da parceira com base em interesse diferente." },
      { id: "c", text: "Talvez eu possa ouvir antes de responder.", isCorrect: true, feedback: "Sugere escuta antes da resposta, fortalecendo o diálogo." },
    ],
  },
  {
    id: 10,
    scenario: "Ela disse que sente que disputa atenção com o time.",
    options: [
      { id: "a", text: "Time é eterno.", isCorrect: false, feedback: "Reforça a competição simbólica entre relação e clube." },
      { id: "b", text: "Ela exagera.", isCorrect: false, feedback: "Minimiza o sentimento da parceira, evitando aprofundamento." },
      { id: "c", text: "Talvez eu precise demonstrar mais presença.", isCorrect: true, feedback: "Indica necessidade de demonstrar presença e atenção intencional." },
    ],
  },
];

export const elesFamilia: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Briguei com meu irmão por causa de um jogador que ele criticou.",
    options: [
      { id: "a", text: "Falou do meu jogador, falou de mim.", isCorrect: false, feedback: "Transforma opinião esportiva em ataque pessoal, ampliando conflito." },
      { id: "b", text: "Ele começou, só respondi.", isCorrect: false, feedback: "Coloca responsabilidade somente no outro, evitando autorreflexão." },
      { id: "c", text: "Talvez seja só futebol e não precise virar algo pessoal.", isCorrect: true, feedback: "Reconhece que é possível discordar sem tornar a situação pessoal." },
    ],
  },
  {
    id: 2,
    scenario: "Em dia de clássico, todo mundo em casa já sabe que eu fico “diferente”.",
    options: [
      { id: "a", text: "Clássico mexe com qualquer um.", isCorrect: false, feedback: "Normaliza a mudança de comportamento como inevitável." },
      { id: "b", text: "Eles já estão acostumados.", isCorrect: false, feedback: "Usa o costume da família como justificativa para não mudar." },
      { id: "c", text: "Talvez eu possa cuidar para não descontar neles a tensão do jogo.", isCorrect: true, feedback: "Sugere cuidado para não descarregar tensão nos familiares." },
    ],
  },
  {
    id: 3,
    scenario: "Minha família diz que eu fico fechado e de cara amarrada depois de derrota.",
    options: [
      { id: "a", text: "Melhor ninguém falar comigo mesmo.", isCorrect: false, feedback: "Incentiva isolamento total como resposta automática." },
      { id: "b", text: "Eles têm que entender minha frustração.", isCorrect: false, feedback: "Coloca a obrigação de compreensão apenas na família." },
      { id: "c", text: "Talvez eu possa avisar que preciso de um tempo, sem afastar todo mundo.", isCorrect: true, feedback: "Propõe comunicação clara sobre a necessidade de tempo, sem romper vínculo." },
    ],
  },
  {
    id: 4,
    scenario: "Já deixei de ajudar em casa porque estava focado no jogo.",
    options: [
      { id: "a", text: "Jogo é só uma vez na semana.", isCorrect: false, feedback: "Minimiza responsabilidade doméstica." },
      { id: "b", text: "Dá pra ajudar depois.", isCorrect: false, feedback: "Adia deveres como se não impactassem outros." },
      { id: "c", text: "Talvez eu possa me organizar para cumprir minhas responsabilidades antes.", isCorrect: true, feedback: "Sugere organização prévia para cumprir obrigações antes do jogo." },
    ],
  },
  {
    id: 5,
    scenario: "Já insisti que meu filho torcesse para o mesmo time que eu.",
    options: [
      { id: "a", text: "Aqui em casa é tradição.", isCorrect: false, feedback: "Impõe tradição sem considerar autonomia." },
      { id: "b", text: "Ele ainda vai aprender a escolher certo.", isCorrect: false, feedback: "Desconsidera a liberdade de escolha da criança." },
      { id: "c", text: "Talvez eu possa deixar ele escolher e apoiar do mesmo jeito.", isCorrect: true, feedback: "Valoriza autonomia e apoio independentemente da escolha." },
    ],
  },
  {
    id: 6,
    scenario: "Minha companheira disse que às vezes sente vergonha do meu jeito em dia de jogo na casa da família.",
    options: [
      { id: "a", text: "Vergonha de quê? É só futebol.", isCorrect: false, feedback: "Minimiza a percepção da outra pessoa." },
      { id: "b", text: "Quem não gosta, que não convide.", isCorrect: false, feedback: "Rompe o diálogo ao invalidar o incômodo." },
      { id: "c", text: "Talvez eu precise refletir sobre como estou me comportando nesses ambientes.", isCorrect: true, feedback: "Convida à reflexão sobre comportamento em ambientes compartilhados." },
    ],
  },
  {
    id: 7,
    scenario: "Já levei discussão do estádio para dentro de casa.",
    options: [
      { id: "a", text: "O jogo ainda não acabou na minha cabeça.", isCorrect: false, feedback: "Prolonga a tensão emocional além do contexto original." },
      { id: "b", text: "Preciso falar tudo que tô sentindo.", isCorrect: false, feedback: "Descarrega emoção sem filtro no ambiente familiar." },
      { id: "c", text: "Talvez eu possa separar o momento do jogo do momento com a família.", isCorrect: true, feedback: "Propõe separar ambientes e momentos." },
    ],
  },
  {
    id: 8,
    scenario: "Quando meu time perde, desconto no primeiro da casa que fala comigo.",
    options: [
      { id: "a", text: "Melhor nem puxar assunto comigo.", isCorrect: false, feedback: "Naturaliza comportamento explosivo." },
      { id: "b", text: "Eles sabem como eu fico.", isCorrect: false, feedback: "Isenta-se de responsabilidade emocional." },
      { id: "c", text: "Talvez eu precise respirar antes de conversar com alguém.", isCorrect: true, feedback: "Incentiva pausa e respiração antes da interação." },
    ],
  },
  {
    id: 9,
    scenario: "Já estraguei um momento em família por causa de provocação.",
    options: [
      { id: "a", text: "Provocou, aguenta.", isCorrect: false, feedback: "Coloca a vitória na discussão acima da convivência." },
      { id: "b", text: "Futebol é assim mesmo.", isCorrect: false, feedback: "Normaliza o conflito como parte inevitável." },
      { id: "c", text: "Talvez preservar o momento seja mais importante que ganhar a discussão.", isCorrect: true, feedback: "Sugere priorizar o momento coletivo." },
    ],
  },
  {
    id: 10,
    scenario: "Minha família evita comentar futebol comigo porque diz que eu me altero fácil.",
    options: [
      { id: "a", text: "Melhor assim, então.", isCorrect: false, feedback: "Aceita o afastamento sem questionar o impacto." },
      { id: "b", text: "Eles exageram.", isCorrect: false, feedback: "Desqualifica a percepção da família." },
      { id: "c", text: "Talvez eu precise rever como estou reagindo às conversas.", isCorrect: true, feedback: "Abre espaço para rever a postura e melhorar a convivência." },
    ],
  },
  {
    id: 11,
    scenario: "Depois de derrota importante, fico dias sem muita conversa em casa.",
    options: [
      { id: "a", text: "Preciso viver o luto do futebol.", isCorrect: false, feedback: "Prolonga o isolamento emocional." },
      { id: "b", text: "Eles precisam entender minha dor.", isCorrect: false, feedback: "Coloca a responsabilidade da compreensão apenas nos outros." },
      { id: "c", text: "Talvez eu possa comunicar o que estou sentindo sem me isolar.", isCorrect: true, feedback: "Incentiva comunicação sobre sentimentos sem afastamento prolongado." },
    ],
  },
];

export const elasTrabalho: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Amiga diz: “Tenho perdido o foco no trabalho porque fico pensando nos jogos o tempo todo.”",
    options: [
      { id: "a", text: "Normal, campeonato é prioridade.", isCorrect: false, feedback: "Coloca o campeonato acima das responsabilidades, normalizando a perda de foco." },
      { id: "b", text: "Trabalho tem todo dia, rodada não.", isCorrect: false, feedback: "Minimiza a importância do trabalho, reforçando desequilíbrio de prioridades." },
      { id: "c", text: "Já pensou em separar horário de foco e horário de futebol?", isCorrect: true, feedback: "Propõe organização prática do tempo, separando momentos de foco e de lazer." },
    ],
  },
  {
    id: 2,
    scenario: "Amigo diz: “Depois da derrota, eu não rendo nada no expediente.”",
    options: [
      { id: "a", text: "Ninguém rende depois de um 3x0.", isCorrect: false, feedback: "Normaliza a queda de produtividade como consequência automática do resultado." },
      { id: "b", text: "Melhor nem mexer comigo nesses dias.", isCorrect: false, feedback: "Cria clima de afastamento, dificultando a convivência profissional." },
      { id: "c", text: "Como você pode virar a chave quando começa o trabalho?", isCorrect: true, feedback: "Estimula reflexão sobre estratégias para mudar o estado emocional ao iniciar o trabalho." },
    ],
  },
  {
    id: 3,
    scenario: "Amiga diz: “Respondi atravessado um colega que zoou meu time.”",
    options: [
      { id: "a", text: "Fez certo, não deixa barato.", isCorrect: false, feedback: "Incentiva confronto direto, reforçando reatividade." },
      { id: "b", text: "Zoou, tem que ouvir.", isCorrect: false, feedback: "Justifica a escalada de provocação, perpetuando tensão." },
      { id: "c", text: "Dava pra manter a brincadeira sem virar climão?", isCorrect: true, feedback: "Convida à reflexão sobre manter leveza sem comprometer o clima profissional." },
    ],
  },
  {
    id: 4,
    scenario: "Amigo diz: “Fico atualizando site esportivo toda hora.”",
    options: [
      { id: "a", text: "Informação nunca é demais.", isCorrect: false, feedback: "Coloca o interesse pessoal acima da produtividade." },
      { id: "b", text: "Só mais uma olhadinha.", isCorrect: false, feedback: "Reforça comportamento repetitivo sem limites claros." },
      { id: "c", text: "Que tal definir pausas específicas pra isso?", isCorrect: true, feedback: "Sugere delimitar pausas específicas, equilibrando interesse e responsabilidade." },
    ],
  },
  {
    id: 5,
    scenario: "Amigo diz: “Já deixei tarefa pra depois porque tinha jogo importante.”",
    options: [
      { id: "a", text: "Jogo decisivo não espera.", isCorrect: false, feedback: "Prioriza o evento esportivo sem considerar impacto profissional." },
      { id: "b", text: "Trabalho dá pra recuperar.", isCorrect: false, feedback: "Subestima as consequências do adiamento." },
      { id: "c", text: "Dá pra se organizar antes pra não misturar as coisas?", isCorrect: true, feedback: "Estimula planejamento prévio para evitar conflitos entre dever e lazer." },
    ],
  },
  {
    id: 6,
    scenario: "Amiga diz: “Meu chefe comentou que eu me empolgo demais falando de futebol.”",
    options: [
      { id: "a", text: "Ele não entende paixão.", isCorrect: false, feedback: "Desconsidera o feedback, fechando espaço para ajuste." },
      { id: "b", text: "Pelo menos eu animo o ambiente.", isCorrect: false, feedback: "Justifica o excesso pelo lado positivo, sem avaliar o contexto." },
      { id: "c", text: "Talvez seja questão de dosar dependendo do espaço.", isCorrect: true, feedback: "Propõe dosar a intensidade conforme o ambiente." },
    ],
  },
  {
    id: 7,
    scenario: "Amigo diz: “Provoco geral quando meu time ganha.”",
    options: [
      { id: "a", text: "Tem que aproveitar.", isCorrect: false, feedback: "Prioriza a euforia sem considerar impacto nos colegas." },
      { id: "b", text: "Quem perdeu aguenta.", isCorrect: false, feedback: "Ignora possíveis desgastes acumulados." },
      { id: "c", text: "Dá pra comemorar sem criar desgaste?", isCorrect: true, feedback: "Sugere comemorar de forma respeitosa." },
    ],
  },
  {
    id: 8,
    scenario: "Amigo diz: “Gritei gol no meio do escritório.”",
    options: [
      { id: "a", text: "Gol é gol.", isCorrect: false, feedback: "Coloca a emoção acima do contexto coletivo." },
      { id: "b", text: "Emoção não se segura.", isCorrect: false, feedback: "Naturaliza o impulso sem considerar o ambiente compartilhado." },
      { id: "c", text: "Ambiente compartilhado pede cuidado?", isCorrect: true, feedback: "Convida à reflexão sobre adequação ao espaço profissional." },
    ],
  },
  {
    id: 9,
    scenario: "Amiga diz: “Já fiquei emburrada o dia todo por causa de resultado.”",
    options: [
      { id: "a", text: "Preciso viver isso.", isCorrect: false, feedback: "Valoriza a permanência no estado negativo." },
      { id: "b", text: "Eles que entendam.", isCorrect: false, feedback: "Transfere responsabilidade emocional para os outros." },
      { id: "c", text: "Vale levar o resultado pra dentro do expediente?", isCorrect: true, feedback: "Questiona a necessidade de levar frustração esportiva para o expediente." },
    ],
  },
  {
    id: 10,
    scenario: "Amigo diz: “Fico provocando colega rival a semana inteira.”",
    options: [
      { id: "a", text: "Faz parte.", isCorrect: false, feedback: "Normaliza provocação constante." },
      { id: "b", text: "É só brincadeira.", isCorrect: false, feedback: "Minimiza o possível desconforto do outro." },
      { id: "c", text: "A brincadeira está sendo respeitosa?", isCorrect: true, feedback: "Incentiva avaliar se a brincadeira está sendo respeitosa." },
    ],
  },
  {
    id: 11,
    scenario: "Amigo diz: “Levo rivalidade pro lado pessoal.”",
    options: [
      { id: "a", text: "Falou do time, falou de mim.", isCorrect: false, feedback: "Confunde clube com identidade individual." },
      { id: "b", text: "Eu sou assim mesmo.", isCorrect: false, feedback: "Naturaliza postura inflexível." },
      { id: "c", text: "Dá pra separar identidade pessoal do clube?", isCorrect: true, feedback: "Sugere separar paixão esportiva da identidade pessoal." },
    ],
  },
];

export const elasRelacionamento: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Amiga diz: “Em dia de jogo eu praticamente sumo.”",
    options: [
      { id: "a", text: "Jogo é sagrado.", isCorrect: false, feedback: "Coloca o jogo como prioridade absoluta." },
      { id: "b", text: "Todo mundo sabe como é.", isCorrect: false, feedback: "Naturaliza a ausência como inevitável." },
      { id: "c", text: "Dá pra combinar momentos pra ninguém se sentir deixado de lado?", isCorrect: true, feedback: "Propõe combinação prévia para equilibrar presença e lazer." },
    ],
  },
  {
    id: 2,
    scenario: "Amiga diz: “Ele fala que eu fico agressiva quando meu time perde.”",
    options: [
      { id: "a", text: "Fico mesmo.", isCorrect: false, feedback: "Aceita comportamento agressivo como inevitável." },
      { id: "b", text: "Futebol é emoção.", isCorrect: false, feedback: "Justifica a explosividade pela emoção do futebol." },
      { id: "c", text: "Como isso impacta quem tá perto?", isCorrect: true, feedback: "Convida à reflexão sobre o impacto do comportamento em quem está por perto." },
    ],
  },
  {
    id: 3,
    scenario: "Amiga diz: “Já falei mais alto do que devia.”",
    options: [
      { id: "a", text: "Emoção é assim.", isCorrect: false, feedback: "Normaliza a alteração de tom como algo comum." },
      { id: "b", text: "Ele exagerou também.", isCorrect: false, feedback: "Divide a responsabilidade automaticamente." },
      { id: "c", text: "Meu tom ajudou ou piorou?", isCorrect: true, feedback: "Estimula avaliar como o tom influencia o diálogo." },
    ],
  },
  {
    id: 4,
    scenario: "Amiga diz: “Levo provocação pro lado pessoal.”",
    options: [
      { id: "a", text: "É pessoal mesmo.", isCorrect: false, feedback: "Associa a crítica ao próprio valor pessoal." },
      { id: "b", text: "Não fico quieta.", isCorrect: false, feedback: "Reforça postura reativa." },
      { id: "c", text: "Dá pra separar identidade do clube?", isCorrect: true, feedback: "Sugere diferenciar identidade de clube." },
    ],
  },
  {
    id: 5,
    scenario: "Amiga diz: “Ignoro conversa importante por causa de jogo.”",
    options: [
      { id: "a", text: "Depois converso.", isCorrect: false, feedback: "Minimiza a importância do diálogo." },
      { id: "b", text: "Não vai mudar nada agora.", isCorrect: false, feedback: "Adia assunto relevante sem considerar impacto." },
      { id: "c", text: "O momento pedia atenção?", isCorrect: true, feedback: "Questiona se o momento exigia atenção diferente." },
    ],
  },
  {
    id: 6,
    scenario: "Amiga diz: “Ele fala que eu só falo de futebol.”",
    options: [
      { id: "a", text: "Melhor assunto que existe.", isCorrect: false, feedback: "Centraliza a conversa no próprio interesse." },
      { id: "b", text: "Pelo menos eu tenho assunto.", isCorrect: false, feedback: "Valoriza quantidade de assunto sem considerar qualidade de troca." },
      { id: "c", text: "Há espaço pra ouvir o que é importante pra ele?", isCorrect: true, feedback: "Propõe ouvir também o que é importante para o outro." },
    ],
  },
  {
    id: 7,
    scenario: "Amiga diz: “Fico dias emburrada depois de derrota.”",
    options: [
      { id: "a", text: "Preciso viver isso.", isCorrect: false, feedback: "Valoriza a permanência no isolamento emocional." },
      { id: "b", text: "Melhor me deixar quieta.", isCorrect: false, feedback: "Coloca a responsabilidade de compreensão apenas no parceiro." },
      { id: "c", text: "Comunicar sentimento ajuda?", isCorrect: true, feedback: "Incentiva a comunicação de sentimentos em vez do isolamento." },
    ],
  },
  {
    id: 8,
    scenario: "Ela fala: “Você responde seco quando está vendo partida.”",
    options: [
      { id: "a", text: "Não dá pra conversar no meio do lance!", isCorrect: false, feedback: "Prioriza o jogo acima da forma de comunicação." },
      { id: "b", text: "Depois eu falo, ué.", isCorrect: false, feedback: "Adia a responsabilidade pela resposta inadequada." },
      { id: "c", text: "Talvez eu possa avisar antes, em vez de responder de qualquer jeito.", isCorrect: true, feedback: "Propõe aviso prévio e ajuste de tom." },
    ],
  },
  {
    id: 9,
    scenario: "Parceira comenta: “Você sempre transforma qualquer assunto em futebol.”",
    options: [
      { id: "a", text: "Porque futebol explica tudo.", isCorrect: false, feedback: "Reduz a variedade de diálogo." },
      { id: "b", text: "Melhor assunto que esse não tem.", isCorrect: false, feedback: "Ignora o interesse da outra pessoa." },
      { id: "c", text: "Talvez eu precise ouvir mais o que a outra pessoa quer falar.", isCorrect: true, feedback: "Sugere ampliar escuta e diversidade de temas." },
    ],
  },
  {
    id: 10,
    scenario: "Ela diz: “Quando eu falo algo sério, você minimiza se estiver focado no jogo.”",
    options: [
      { id: "a", text: "Não é nada demais.", isCorrect: false, feedback: "Desvaloriza a importância do assunto." },
      { id: "b", text: "Pode esperar acabar o primeiro tempo.", isCorrect: false, feedback: "Adia a escuta de algo relevante." },
      { id: "c", text: "Talvez eu esteja deixando de dar a atenção que a situação merece.", isCorrect: true, feedback: "Reconhece a necessidade de priorizar temas importantes." },
    ],
  },
  {
    id: 11,
    scenario: "Parceira comenta: “Você nunca pergunta se eu quero assistir junto.”",
    options: [
      { id: "a", text: "Mas eu já ligo a TV, é óbvio.", isCorrect: false, feedback: "Parte do pressuposto de que a decisão já está tomada." },
      { id: "b", text: "Se não quiser, é só sair.", isCorrect: false, feedback: "Coloca a responsabilidade da escolha somente na outra pessoa." },
      { id: "c", text: "Talvez eu possa incluir mais, em vez de presumir.", isCorrect: true, feedback: "Sugere inclusão e convite ativo." },
    ],
  },
  {
    id: 12,
    scenario: "Ela diz: “Quando discordo de você sobre futebol, você muda o tom.”",
    options: [
      { id: "a", text: "Porque você não entende.", isCorrect: false, feedback: "Desqualifica opinião diferente." },
      { id: "b", text: "É só brincadeira.", isCorrect: false, feedback: "Minimiza o impacto da mudança de tom." },
      { id: "c", text: "Talvez eu esteja confundindo discordância com ataque.", isCorrect: true, feedback: "Propõe refletir se a discordância está sendo interpretada como ataque." },
    ],
  },
  {
    id: 13,
    scenario: "Parceira fala: “Você ignora mensagens minhas durante o jogo.”",
    options: [
      { id: "a", text: "É porque estou concentrado.", isCorrect: false, feedback: "Prioriza concentração total sem comunicar." },
      { id: "b", text: "Depois eu respondo.", isCorrect: false, feedback: "Adia a resposta sem alinhar expectativa." },
      { id: "c", text: "Talvez eu possa avisar antes e combinar expectativas.", isCorrect: true, feedback: "Sugere combinar previamente disponibilidade e tempo de resposta." },
    ],
  },
];

export const elasFamilia: ResenhaQuestion[] = [
  {
    id: 1,
    scenario: "Parente diz: “Você provoca demais nos almoços de família.”",
    options: [
      { id: "a", text: "Almoço sem zoeira nem tem graça.", isCorrect: false, feedback: "Coloca a zoeira acima da harmonia familiar." },
      { id: "b", text: "Quem não gosta que não venha.", isCorrect: false, feedback: "Rompe o diálogo ao excluir quem se incomoda." },
      { id: "c", text: "Talvez eu possa brincar sem ultrapassar o limite de alguém.", isCorrect: true, feedback: "Sugere manter leveza respeitando limites." },
    ],
  },
  {
    id: 2,
    scenario: "Mãe diz: “Você não percebe quando a conversa já saiu do controle.”",
    options: [
      { id: "a", text: "Controle é superestimado.", isCorrect: false, feedback: "Desvaloriza a importância do autocontrole." },
      { id: "b", text: "Se esquentou, esquentou.", isCorrect: false, feedback: "Aceita a escalada de tensão como inevitável." },
      { id: "c", text: "Talvez eu precise aprender a identificar a hora de baixar o tom.", isCorrect: true, feedback: "Incentiva desenvolver percepção do próprio limite." },
    ],
  },
  {
    id: 3,
    scenario: "Irmão diz: “Você mistura zoeira com ofensa.”",
    options: [
      { id: "a", text: "Futebol é assim mesmo.", isCorrect: false, feedback: "Normaliza o excesso como parte do futebol." },
      { id: "b", text: "Se doeu, é porque sentiu.", isCorrect: false, feedback: "Coloca a responsabilidade na sensibilidade do outro." },
      { id: "c", text: "Talvez eu precise diferenciar brincadeira de desrespeito.", isCorrect: true, feedback: "Propõe diferenciar brincadeira de desrespeito." },
    ],
  },
  {
    id: 4,
    scenario: "Filho(a) fala: “Você fica no celular vendo coisa do time e não participa da conversa.”",
    options: [
      { id: "a", text: "É só rapidinho.", isCorrect: false, feedback: "Minimiza a ausência emocional." },
      { id: "b", text: "Multitarefa resolve.", isCorrect: false, feedback: "Superestima a capacidade de multitarefa." },
      { id: "c", text: "Talvez eu esteja mais presente na tela do que aqui.", isCorrect: true, feedback: "Reconhece a importância da presença real." },
    ],
  },
  {
    id: 5,
    scenario: "Amiga diz: “Almoço vira discussão quando falam do meu time.”",
    options: [
      { id: "a", text: "Almoço bom é com debate.", isCorrect: false, feedback: "Valoriza o debate acima do clima familiar." },
      { id: "b", text: "Quem não aguenta, que saia.", isCorrect: false, feedback: "Exclui quem se incomoda." },
      { id: "c", text: "Dá pra manter leve sem virar briga?", isCorrect: true, feedback: "Sugere manter a conversa leve." },
    ],
  },
  {
    id: 6,
    scenario: "Amiga diz: “Fico dias emburrada depois de derrota.”",
    options: [
      { id: "a", text: "Preciso viver o luto.", isCorrect: false, feedback: "Normaliza o isolamento prolongado." },
      { id: "b", text: "Eles que entendam.", isCorrect: false, feedback: "Coloca a responsabilidade nos outros." },
      { id: "c", text: "Dá pra comunicar sem se isolar?", isCorrect: true, feedback: "Incentiva comunicar sentimentos sem se afastar." },
    ],
  },
  {
    id: 7,
    scenario: "Amiga diz: “Grito muito e incomodo quem mora comigo.”",
    options: [
      { id: "a", text: "Gol é gol.", isCorrect: false, feedback: "Coloca a emoção acima do convívio." },
      { id: "b", text: "Casa aguenta.", isCorrect: false, feedback: "Subestima o impacto no ambiente compartilhado." },
      { id: "c", text: "Ambiente compartilhado pede cuidado?", isCorrect: true, feedback: "Reconhece a necessidade de cuidado coletivo." },
    ],
  },
  {
    id: 8,
    scenario: "Amiga diz: “Insisto que meu filho torça pro meu time.”",
    options: [
      { id: "a", text: "Aqui é tradição.", isCorrect: false, feedback: "Impõe tradição como obrigação." },
      { id: "b", text: "Ele vai aprender.", isCorrect: false, feedback: "Desconsidera a autonomia individual." },
      { id: "c", text: "Ele pode escolher?", isCorrect: true, feedback: "Valoriza a liberdade de escolha." },
    ],
  },
  {
    id: 9,
    scenario: "Amiga diz: “Levo tensão do estádio pra casa.”",
    options: [
      { id: "a", text: "O jogo ainda tá na cabeça.", isCorrect: false, feedback: "Prolonga o estado emocional intenso." },
      { id: "b", text: "Preciso falar tudo.", isCorrect: false, feedback: "Descarrega emoção sem filtro." },
      { id: "c", text: "Dá pra separar os ambientes?", isCorrect: true, feedback: "Propõe separar ambientes e momentos." },
    ],
  },
  {
    id: 10,
    scenario: "Amiga diz: “Minha família evita falar de futebol comigo.”",
    options: [
      { id: "a", text: "Melhor assim.", isCorrect: false, feedback: "Aceita o afastamento sem reflexão." },
      { id: "b", text: "Eles são sensíveis.", isCorrect: false, feedback: "Desqualifica a percepção dos outros." },
      { id: "c", text: "Meu jeito está afastando?", isCorrect: true, feedback: "Convida à autoanálise sobre a postura." },
    ],
  },
  {
    id: 11,
    scenario: "Amiga diz: “Já estraguei momento em família por causa de jogo.”",
    options: [
      { id: "a", text: "Acontece.", isCorrect: false, feedback: "Minimiza o impacto da situação." },
      { id: "b", text: "Futebol é intenso.", isCorrect: false, feedback: "Naturaliza o conflito como inevitável." },
      { id: "c", text: "O momento valia mais que a discussão?", isCorrect: true, feedback: "Sugere refletir sobre a prioridade do momento coletivo." },
    ],
  },
];

export const RESENHA_TOPICS: { key: ResenhaTopicKey; label: string; description: string }[] = [
  { key: "trabalho", label: "Trabalho", description: "Cenários no ambiente profissional" },
  { key: "relacionamento", label: "Relacionamento", description: "Cenários na vida a dois" },
  { key: "familia", label: "Família", description: "Cenários no convívio familiar" },
];

export const RESENHA_QUESTIONS: Record<"eles" | "elas", Record<ResenhaTopicKey, ResenhaQuestion[]>> = {
  eles: {
    trabalho: elesTrabalho,
    relacionamento: elesRelacionamento,
    familia: elesFamilia,
  },
  elas: {
    trabalho: elasTrabalho,
    relacionamento: elasRelacionamento,
    familia: elasFamilia,
  },
};
