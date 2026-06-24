import { useState } from "react";
import { MessageCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface Question {
  id: number;
  scenario: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    feedback: string;
  }[];
}

const questionsHomens: Question[] = [
  {
    id: 1,
    scenario: "Seu amigo está chateado porque o time dele perdeu uma final importante. Ele diz: 'Não aguento mais, sempre a mesma coisa!'",
    options: [
      { id: "a", text: "Relaxa, é só um jogo!", isCorrect: false, feedback: "Minimizar os sentimentos dele pode fazê-lo se sentir incompreendido." },
      { id: "b", text: "Cara, eu entendo. Perder dói mesmo. Quer falar sobre isso?", isCorrect: true, feedback: "Validar os sentimentos e oferecer escuta é a melhor abordagem." },
      { id: "c", text: "O time do meu vizinho também perdeu, nem ligo.", isCorrect: false, feedback: "Mudar de assunto não ajuda seu amigo a processar os sentimentos." },
      { id: "d", text: "Pelo menos vocês chegaram na final!", isCorrect: false, feedback: "Tentar ver o lado positivo pode parecer que você não entende a dor dele." },
    ],
  },
  {
    id: 2,
    scenario: "Durante o jogo, você percebe que está ficando muito estressado e ansioso. Seu coração está acelerado.",
    options: [
      { id: "a", text: "Ignoro e continuo assistindo normalmente.", isCorrect: false, feedback: "Ignorar sinais de ansiedade pode piorar a situação." },
      { id: "b", text: "Respiro fundo algumas vezes e tento relaxar os ombros.", isCorrect: true, feedback: "Técnicas de respiração ajudam a regular o sistema nervoso." },
      { id: "c", text: "Tomo mais uma cerveja para relaxar.", isCorrect: false, feedback: "Álcool pode intensificar a ansiedade a longo prazo." },
      { id: "d", text: "Desligo a TV e vou fazer outra coisa.", isCorrect: false, feedback: "Evitar completamente pode ser uma estratégia válida, mas não resolve a raiz." },
    ],
  },
  {
    id: 3,
    scenario: "Seu colega de trabalho faz uma piada sobre seu time ter sido rebaixado. Você fica irritado.",
    options: [
      { id: "a", text: "Respondo com uma piada mais pesada sobre o time dele.", isCorrect: false, feedback: "Escalar a provocação pode gerar conflito real no ambiente de trabalho." },
      { id: "b", text: "Reconheço que a piada me incomodou e digo isso com calma.", isCorrect: true, feedback: "Comunicar seus limites com assertividade é saudável e maduro." },
      { id: "c", text: "Finjo que não ouvi e fico remoendo.", isCorrect: false, feedback: "Engolir a irritação pode gerar ressentimento acumulado." },
      { id: "d", text: "Saio da sala batendo a porta.", isCorrect: false, feedback: "Reações impulsivas prejudicam seus relacionamentos profissionais." },
    ],
  },
  {
    id: 4,
    scenario: "Você percebe que está gastando muito dinheiro com ingressos e camisas do time, prejudicando suas finanças.",
    options: [
      { id: "a", text: "Futebol é minha paixão, não tem preço.", isCorrect: false, feedback: "Paixão sem limites pode gerar problemas financeiros sérios." },
      { id: "b", text: "Faço um orçamento mensal específico para gastos com futebol.", isCorrect: true, feedback: "Planejar financeiramente permite curtir sem comprometer a saúde financeira." },
      { id: "c", text: "Paro de ir aos jogos completamente.", isCorrect: false, feedback: "Cortar radicalmente pode gerar frustração e não é sustentável." },
      { id: "d", text: "Peço dinheiro emprestado quando preciso.", isCorrect: false, feedback: "Endividar-se por lazer é um sinal de alerta importante." },
    ],
  },
  {
    id: 5,
    scenario: "Após uma derrota, você desconta a raiva nos familiares em casa, gritando com sua esposa e filhos.",
    options: [
      { id: "a", text: "É normal, todo mundo fica bravo.", isCorrect: false, feedback: "Normalizar agressividade verbal é prejudicial para toda a família." },
      { id: "b", text: "Reconheço que preciso encontrar formas saudáveis de lidar com a frustração.", isCorrect: true, feedback: "Autoconhecimento é o primeiro passo para mudar comportamentos nocivos." },
      { id: "c", text: "Peço desculpas, mas sei que vai acontecer de novo.", isCorrect: false, feedback: "Desculpas sem mudança de comportamento perdem o valor." },
      { id: "d", text: "A culpa é do time, não minha.", isCorrect: false, feedback: "Transferir responsabilidade não resolve o problema comportamental." },
    ],
  },
  {
    id: 6,
    scenario: "Um amigo revela que está com depressão e que o futebol é a única coisa que o anima. Ele parece muito dependente disso.",
    options: [
      { id: "a", text: "Pelo menos você tem o futebol!", isCorrect: false, feedback: "Reforçar a dependência emocional não ajuda na recuperação." },
      { id: "b", text: "Fico feliz que o futebol te ajuda. Já pensou em buscar apoio profissional também?", isCorrect: true, feedback: "Validar e sugerir ajuda profissional é a combinação ideal." },
      { id: "c", text: "Depressão é frescura, assiste mais jogo que passa.", isCorrect: false, feedback: "Invalidar doenças mentais é extremamente prejudicial." },
      { id: "d", text: "Mudo de assunto porque não sei lidar com isso.", isCorrect: false, feedback: "Evitar o tema pode fazer seu amigo sentir que não pode contar com você." },
    ],
  },
  {
    id: 7,
    scenario: "Você está no estádio e vê torcedores do seu time agredindo verbalmente uma família da torcida adversária, incluindo crianças.",
    options: [
      { id: "a", text: "Não é da minha conta, cada um cuida de si.", isCorrect: false, feedback: "Omissão diante de violência contribui para normalizar comportamentos agressivos." },
      { id: "b", text: "Intervenho de forma segura ou chamo a segurança do estádio.", isCorrect: true, feedback: "Agir com responsabilidade protege pessoas vulneráveis e melhora o ambiente." },
      { id: "c", text: "Gravo um vídeo para postar nas redes sociais.", isCorrect: false, feedback: "Expor a situação sem ajudar não resolve o problema imediato." },
      { id: "d", text: "Participo das provocações, afinal é rivalidade.", isCorrect: false, feedback: "Violência nunca é justificável, especialmente contra famílias e crianças." },
    ],
  },
  {
    id: 8,
    scenario: "Seu filho de 10 anos quer torcer para um time diferente do seu. Você fica decepcionado.",
    options: [
      { id: "a", text: "Proíbo ele e digo que na minha casa se torce pro meu time.", isCorrect: false, feedback: "Impor escolhas suprime a individualidade da criança." },
      { id: "b", text: "Respeito a escolha dele e aproveito para compartilhar o amor pelo esporte juntos.", isCorrect: true, feedback: "Respeitar a individualidade fortalece o vínculo e ensina sobre respeito." },
      { id: "c", text: "Ignoro e finjo que não ouvi.", isCorrect: false, feedback: "Ignorar a escolha dele pode fazê-lo sentir que sua opinião não importa." },
      { id: "d", text: "Faço chantagem emocional: 'Você vai me deixar triste se torcer pra outro time.'", isCorrect: false, feedback: "Chantagem emocional é uma forma de manipulação prejudicial ao desenvolvimento." },
    ],
  },
  {
    id: 9,
    scenario: "Você perdeu uma aposta esportiva e agora está com dívidas. Pensa em apostar mais para recuperar o dinheiro.",
    options: [
      { id: "a", text: "Uma aposta grande pode resolver tudo de uma vez.", isCorrect: false, feedback: "Esse pensamento é característico do vício em apostas e leva a perdas maiores." },
      { id: "b", text: "Paro de apostar e busco ajuda se não conseguir parar sozinho.", isCorrect: true, feedback: "Reconhecer o problema e buscar ajuda é fundamental para sair do ciclo." },
      { id: "c", text: "Aposto só um pouquinho, com mais cuidado dessa vez.", isCorrect: false, feedback: "A ilusão de controle é uma armadilha comum no comportamento de risco." },
      { id: "d", text: "Escondo as dívidas da família.", isCorrect: false, feedback: "Esconder problemas financeiros piora a situação e prejudica a confiança." },
    ],
  },
  {
    id: 10,
    scenario: "Seu melhor amigo começa a se afastar do grupo porque está passando por problemas pessoais. Ele para de ir aos jogos.",
    options: [
      { id: "a", text: "Se ele não quer vir, problema dele.", isCorrect: false, feedback: "Indiferença pode piorar o isolamento de quem está sofrendo." },
      { id: "b", text: "Procuro ele, pergunto como está e digo que estou disponível para conversar.", isCorrect: true, feedback: "Demonstrar preocupação genuína fortalece amizades e pode ajudar muito." },
      { id: "c", text: "Convido insistentemente para os jogos mesmo ele dizendo que não quer.", isCorrect: false, feedback: "Insistir sem ouvir pode ser invasivo e desrespeitoso." },
      { id: "d", text: "Falo mal dele pro grupo por ter abandonado a turma.", isCorrect: false, feedback: "Julgar e fofoca prejudicam a amizade e ignoram o sofrimento do outro." },
    ],
  },
  {
    id: 11,
    scenario: "No trabalho, seu chefe faz uma crítica justa ao seu desempenho. Você, já irritado pela derrota do time ontem, reage mal.",
    options: [
      { id: "a", text: "Discuto com o chefe e digo que ele está pegando no meu pé.", isCorrect: false, feedback: "Misturar frustrações pessoais com trabalho pode ter consequências sérias." },
      { id: "b", text: "Peço um momento, reconheço que estou emocionalmente afetado e respondo depois.", isCorrect: true, feedback: "Ter consciência do seu estado emocional evita reações impulsivas." },
      { id: "c", text: "Aceito calado mas fico com raiva o dia todo.", isCorrect: false, feedback: "Reprimir a raiva sem processá-la só adia o problema." },
      { id: "d", text: "Culpo o time pela minha irritação.", isCorrect: false, feedback: "Você é responsável por como lida com suas emoções, independente da causa." },
    ],
  },
  {
    id: 12,
    scenario: "Você nota que bebe muito mais álcool em dias de jogo do que o normal. Seus amigos também bebem bastante.",
    options: [
      { id: "a", text: "Todo mundo bebe, faz parte da cultura do futebol.", isCorrect: false, feedback: "Normalizar o consumo excessivo é perigoso para a saúde física e mental." },
      { id: "b", text: "Monitoro meu consumo e estabeleço um limite antes de começar.", isCorrect: true, feedback: "Automonitoramento e limites são ferramentas de autocuidado essenciais." },
      { id: "c", text: "Só bebo em dia de jogo, então tá tranquilo.", isCorrect: false, feedback: "A frequência não é o único fator — a quantidade por ocasião também importa." },
      { id: "d", text: "Paro de beber completamente e fico chateado por não poder.", isCorrect: false, feedback: "Radicalismo pode não ser sustentável e gerar frustração desnecessária." },
    ],
  },
  {
    id: 13,
    scenario: "Seu time contratou um jogador de outro país. Alguns torcedores fazem comentários xenofóbicos nas redes sociais.",
    options: [
      { id: "a", text: "Concordo, devia contratar só brasileiro.", isCorrect: false, feedback: "Xenofobia é preconceito e não tem espaço no esporte nem na sociedade." },
      { id: "b", text: "Me posiciono contra os comentários e apoio o jogador.", isCorrect: true, feedback: "Combater preconceito ativamente contribui para um ambiente mais justo." },
      { id: "c", text: "Ignoro, é só internet.", isCorrect: false, feedback: "Silêncio diante do preconceito pode ser interpretado como conivência." },
      { id: "d", text: "Rio dos comentários porque são 'piadas'.", isCorrect: false, feedback: "Humor baseado em preconceito não é piada, é discriminação." },
    ],
  },
  {
    id: 14,
    scenario: "Você está em um relacionamento e sua parceira reclama que você dá mais atenção ao futebol do que a ela.",
    options: [
      { id: "a", text: "Digo que ela está exagerando.", isCorrect: false, feedback: "Invalidar o sentimento dela gera mais conflito e distância." },
      { id: "b", text: "Ouço ela e juntos definimos momentos para futebol e momentos a dois.", isCorrect: true, feedback: "Negociação e equilíbrio fortalecem o relacionamento e mantêm o hobby." },
      { id: "c", text: "Assisto escondido para evitar briga.", isCorrect: false, feedback: "Esconder compromete a confiança no relacionamento." },
      { id: "d", text: "Digo que futebol vem primeiro.", isCorrect: false, feedback: "Priorizar rigidamente um hobby sobre pessoas importantes é um sinal de alerta." },
    ],
  },
  {
    id: 15,
    scenario: "Um jogador do seu time erra um pênalti decisivo. Nas redes sociais, torcedores fazem ameaças de morte a ele.",
    options: [
      { id: "a", text: "Ele mereceu as críticas, errou na hora H.", isCorrect: false, feedback: "Críticas são válidas, mas ameaças de morte são crimes e nunca aceitáveis." },
      { id: "b", text: "Defendo o jogador e denuncio as ameaças.", isCorrect: true, feedback: "Proteger a integridade de atletas é responsabilidade de todos os torcedores." },
      { id: "c", text: "Não ameaço, mas dou risada dos memes.", isCorrect: false, feedback: "Rir da humilhação de alguém contribui para um ambiente tóxico." },
      { id: "d", text: "Mando mensagem ofensiva no Instagram dele.", isCorrect: false, feedback: "Cyberbullying causa danos reais à saúde mental dos atletas." },
    ],
  },
  {
    id: 16,
    scenario: "Você percebe que não consegue dormir direito em véspera de jogos importantes. A ansiedade toma conta.",
    options: [
      { id: "a", text: "É normal, mostra que sou torcedor de verdade.", isCorrect: false, feedback: "Insônia por ansiedade não é sinal de paixão — é sinal de que precisa de ajuda." },
      { id: "b", text: "Pratico técnicas de relaxamento e considero falar com um profissional.", isCorrect: true, feedback: "Buscar ferramentas de regulação emocional é sinal de maturidade." },
      { id: "c", text: "Tomo remédio para dormir por conta própria.", isCorrect: false, feedback: "Automedicação é perigosa e não trata a causa da ansiedade." },
      { id: "d", text: "Fico no celular vendo análises até pegar no sono.", isCorrect: false, feedback: "Telas e conteúdo estimulante pioram a qualidade do sono." },
    ],
  },
  {
    id: 17,
    scenario: "Seu grupo de amigos torcedores só fala de futebol. Você gostaria de compartilhar outros assuntos, mas tem medo de ser zoado.",
    options: [
      { id: "a", text: "Fico quieto e sigo a maioria.", isCorrect: false, feedback: "Reprimir sua necessidade de conexão mais profunda é prejudicial." },
      { id: "b", text: "Inicio outros assuntos naturalmente e vejo como o grupo reage.", isCorrect: true, feedback: "Diversificar conversas fortalece amizades para além de um único tema." },
      { id: "c", text: "Procuro outros amigos e abandono o grupo.", isCorrect: false, feedback: "Abandonar sem tentar mudança é uma resposta extrema." },
      { id: "d", text: "Reclamo que o grupo é chato.", isCorrect: false, feedback: "Criticar o grupo gera defensividade e não abre espaço para mudança." },
    ],
  },
  {
    id: 18,
    scenario: "Você foi ao estádio com seu filho e presenciou uma briga entre torcidas. Ele ficou assustado.",
    options: [
      { id: "a", text: "Digo que faz parte e que ele precisa se acostumar.", isCorrect: false, feedback: "Normalizar violência para uma criança é extremamente prejudicial." },
      { id: "b", text: "Protejo ele, explico que violência é errada e valido os sentimentos dele.", isCorrect: true, feedback: "Proteger, explicar e acolher é o papel do cuidador responsável." },
      { id: "c", text: "Nunca mais levo ele ao estádio.", isCorrect: false, feedback: "Evitar completamente pode privar a criança de experiências positivas futuras." },
      { id: "d", text: "Digo para ele não ser medroso.", isCorrect: false, feedback: "Invalidar o medo da criança prejudica sua confiança e segurança emocional." },
    ],
  },
  {
    id: 19,
    scenario: "Você está obeso e sedentário, mas gasta horas assistindo futebol. Um amigo sugere que vocês joguem bola juntos.",
    options: [
      { id: "a", text: "Prefiro assistir, jogar é cansativo.", isCorrect: false, feedback: "Manter o sedentarismo compromete sua saúde a longo prazo." },
      { id: "b", text: "Aceito o convite e começo aos poucos, respeitando meu ritmo.", isCorrect: true, feedback: "Praticar esporte melhora saúde física e mental, e fortalece amizades." },
      { id: "c", text: "Me ofendo com a sugestão.", isCorrect: false, feedback: "A sugestão vem de um lugar de cuidado, não de julgamento." },
      { id: "d", text: "Digo que vou começar segunda-feira e nunca começo.", isCorrect: false, feedback: "Procrastinação crônica impede mudanças necessárias para sua saúde." },
    ],
  },
  {
    id: 20,
    scenario: "Você percebe que fica extremamente agressivo ao dirigir depois de derrotas do seu time, quase causando acidentes.",
    options: [
      { id: "a", text: "É raiva passageira, logo passa.", isCorrect: false, feedback: "Direção agressiva coloca sua vida e a de outros em risco real." },
      { id: "b", text: "Espero me acalmar antes de dirigir e busco formas de processar a frustração.", isCorrect: true, feedback: "Segurança vem primeiro. Esperar até se acalmar é responsável e maduro." },
      { id: "c", text: "Coloco música alta para descontar.", isCorrect: false, feedback: "Estímulos intensos podem manter a agitação em vez de acalmar." },
      { id: "d", text: "Acho que todo mundo fica assim.", isCorrect: false, feedback: "Normalizar direção perigosa é minimizar um comportamento de alto risco." },
    ],
  },
];

const questionsMulheres: Question[] = [
  {
    id: 1,
    scenario: "Sua amiga está frustrada porque não consegue acompanhar os jogos com o namorado. Ela diz: 'Ele só fala de futebol, me sinto excluída.'",
    options: [
      { id: "a", text: "Termina com ele então!", isCorrect: false, feedback: "Sugerir término imediato não ajuda a resolver o problema de comunicação." },
      { id: "b", text: "Entendo como você se sente. Já tentou conversar com ele sobre isso?", isCorrect: true, feedback: "Validar sentimentos e sugerir comunicação é o melhor caminho." },
      { id: "c", text: "Futebol é chato mesmo.", isCorrect: false, feedback: "Concordar com a crítica não resolve o problema do relacionamento." },
      { id: "d", text: "Você devia aprender sobre futebol para acompanhar.", isCorrect: false, feedback: "Colocar a responsabilidade só nela não é justo." },
    ],
  },
  {
    id: 2,
    scenario: "Você está no estádio e um grupo de homens começa a fazer comentários machistas sobre você torcer.",
    options: [
      { id: "a", text: "Ignoro porque é sempre assim.", isCorrect: false, feedback: "Aceitar machismo como normal perpetua o problema." },
      { id: "b", text: "Me posiciono com firmeza, sem me colocar em risco, e busco apoio das pessoas ao redor.", isCorrect: true, feedback: "Assertividade com segurança é a abordagem mais saudável." },
      { id: "c", text: "Vou embora e nunca mais volto ao estádio.", isCorrect: false, feedback: "Desistir do que você ama por causa de outros é injusto consigo mesma." },
      { id: "d", text: "Revido com ofensas.", isCorrect: false, feedback: "Escalar o conflito pode te colocar em perigo." },
    ],
  },
  {
    id: 3,
    scenario: "Sua filha adolescente quer jogar futebol, mas seu marido acha que não é esporte para meninas.",
    options: [
      { id: "a", text: "Concordo com ele para evitar discussão.", isCorrect: false, feedback: "Evitar o conflito prejudica o desenvolvimento e os sonhos da sua filha." },
      { id: "b", text: "Apoio minha filha e converso com meu marido sobre igualdade no esporte.", isCorrect: true, feedback: "Apoiar a criança e educar sobre igualdade fortalece a família." },
      { id: "c", text: "Inscrevo ela escondida.", isCorrect: false, feedback: "Agir às escondidas prejudica a confiança no casal." },
      { id: "d", text: "Sugiro um esporte 'mais feminino'.", isCorrect: false, feedback: "Reforçar estereótipos de gênero limita as possibilidades da criança." },
    ],
  },
  {
    id: 4,
    scenario: "Você é jornalista esportiva e recebe comentários online dizendo que mulher não entende de futebol.",
    options: [
      { id: "a", text: "Paro de postar sobre futebol.", isCorrect: false, feedback: "Ceder ao machismo é abrir mão do seu espaço profissional." },
      { id: "b", text: "Continuo meu trabalho com confiança e denuncio os comentários abusivos.", isCorrect: true, feedback: "Persistir e denunciar abre caminho para outras mulheres no esporte." },
      { id: "c", text: "Respondo com raiva cada comentário.", isCorrect: false, feedback: "Engajar com trolls drena sua energia e não muda opiniões." },
      { id: "d", text: "Mudo para outro assunto menos polêmico.", isCorrect: false, feedback: "Evitar o tema por medo é deixar o machismo vencer." },
    ],
  },
  {
    id: 5,
    scenario: "Você se sente ansiosa e triste após uma sequência de derrotas do seu time. Isso está afetando seu trabalho.",
    options: [
      { id: "a", text: "É besteira ficar assim por futebol.", isCorrect: false, feedback: "Minimizar suas emoções não ajuda a processá-las." },
      { id: "b", text: "Reconheço que o futebol afeta meu emocional e busco estratégias de equilíbrio.", isCorrect: true, feedback: "Autoconhecimento emocional é fundamental para o bem-estar." },
      { id: "c", text: "Paro de acompanhar futebol.", isCorrect: false, feedback: "Abandonar algo que você ama não é a solução — equilíbrio é." },
      { id: "d", text: "Escondo minha tristeza porque vão me julgar.", isCorrect: false, feedback: "Reprimir emoções pode levar a problemas de saúde mental." },
    ],
  },
  {
    id: 6,
    scenario: "No grupo de torcedoras, uma amiga está claramente com problemas em casa, mas diz que 'tá tudo bem'.",
    options: [
      { id: "a", text: "Se ela diz que tá bem, respeito.", isCorrect: false, feedback: "Aceitar superficialmente pode deixar alguém sem apoio quando precisa." },
      { id: "b", text: "Mostro que estou disponível sem pressionar: 'Tô aqui se precisar conversar.'", isCorrect: true, feedback: "Oferecer apoio sem invasão cria um ambiente seguro para abertura." },
      { id: "c", text: "Comento com outras amigas sobre os problemas dela.", isCorrect: false, feedback: "Fofoca quebra a confiança e pode piorar a situação." },
      { id: "d", text: "Digo que ela precisa de terapia.", isCorrect: false, feedback: "Prescrever soluções sem ser solicitada pode parecer invasivo." },
    ],
  },
  {
    id: 7,
    scenario: "Você descobriu que seu time vai contratar uma jogadora acusada de comportamento antiético. Outras torcedoras querem boicotar.",
    options: [
      { id: "a", text: "Se ela joga bem, o que importa é dentro de campo.", isCorrect: false, feedback: "Separar completamente comportamento de desempenho ignora valores importantes." },
      { id: "b", text: "Reflito sobre meus valores, me informo e decido minha posição de forma consciente.", isCorrect: true, feedback: "Pensamento crítico e decisão consciente mostram maturidade." },
      { id: "c", text: "Sigo a maioria sem pensar muito.", isCorrect: false, feedback: "Seguir o grupo sem reflexão própria é falta de autonomia." },
      { id: "d", text: "Ataco a jogadora nas redes sociais.", isCorrect: false, feedback: "Ataques online são agressão, independente do motivo." },
    ],
  },
  {
    id: 8,
    scenario: "Seu namorado diz que vai assistir ao jogo com os amigos e que você não pode ir porque 'é programa de homem'.",
    options: [
      { id: "a", text: "Aceito e fico em casa.", isCorrect: false, feedback: "Aceitar exclusão baseada em gênero reforça desigualdade." },
      { id: "b", text: "Converso sobre como essa frase me faz sentir e que esporte é para todos.", isCorrect: true, feedback: "Comunicação assertiva sobre como você se sente promove respeito mútuo." },
      { id: "c", text: "Vou mesmo assim sem avisar.", isCorrect: false, feedback: "Ir sem comunicação gera conflito em vez de resolver o problema." },
      { id: "d", text: "Termino o relacionamento imediatamente.", isCorrect: false, feedback: "Uma conversa pode resolver antes de tomar decisões drásticas." },
    ],
  },
  {
    id: 9,
    scenario: "Você está ensinando futebol para crianças e um pai diz que as meninas deviam sair para os meninos jogarem melhor.",
    options: [
      { id: "a", text: "Concordo para evitar conflito.", isCorrect: false, feedback: "Ceder ao preconceito na frente das crianças ensina que ele é aceitável." },
      { id: "b", text: "Explico que o esporte é para todos e que a inclusão é parte do meu trabalho.", isCorrect: true, feedback: "Defender a inclusão educa crianças e adultos sobre respeito." },
      { id: "c", text: "Grito com o pai.", isCorrect: false, feedback: "Agressividade não educa e piora o ambiente para as crianças." },
      { id: "d", text: "Separo meninos e meninas em grupos.", isCorrect: false, feedback: "Segregar reforça a ideia de que meninas não podem jogar com meninos." },
    ],
  },
  {
    id: 10,
    scenario: "Você criou uma comunidade online de torcedoras e está recebendo assédio de perfis masculinos que invadem o grupo.",
    options: [
      { id: "a", text: "Fecho o grupo.", isCorrect: false, feedback: "Desistir do espaço que você criou é deixar os assediadores vencerem." },
      { id: "b", text: "Modero o grupo com regras claras, bloqueio assediadores e denuncio.", isCorrect: true, feedback: "Moderação firme protege o espaço e as participantes." },
      { id: "c", text: "Ignoro os comentários e espero parar.", isCorrect: false, feedback: "Assédio ignorado tende a escalar, não a parar." },
      { id: "d", text: "Revido com ofensas.", isCorrect: false, feedback: "Escalar o conflito pode intensificar o assédio." },
    ],
  },
  {
    id: 11,
    scenario: "Sua mãe não entende por que você gasta tempo e dinheiro com futebol. Ela diz: 'Isso não é coisa de mulher direita.'",
    options: [
      { id: "a", text: "Paro de falar de futebol perto dela.", isCorrect: false, feedback: "Esconder sua paixão por medo de julgamento não é saudável." },
      { id: "b", text: "Explico com carinho o que o futebol significa pra mim e peço respeito.", isCorrect: true, feedback: "Comunicar seus sentimentos com empatia pode mudar perspectivas." },
      { id: "c", text: "Discuto agressivamente.", isCorrect: false, feedback: "Agressividade não convence e prejudica o relacionamento." },
      { id: "d", text: "Gasto escondido.", isCorrect: false, feedback: "Esconder compromete a confiança e não resolve o problema real." },
    ],
  },
  {
    id: 12,
    scenario: "Você foi convidada para comentar um jogo na TV, mas está com síndrome da impostora, achando que não é boa o suficiente.",
    options: [
      { id: "a", text: "Recuso a oportunidade.", isCorrect: false, feedback: "A síndrome da impostora faz você subestimar sua competência real." },
      { id: "b", text: "Aceito, me preparo bem e lembro que fui convidada por meu mérito.", isCorrect: true, feedback: "Enfrentar o medo com preparação é o caminho para o crescimento." },
      { id: "c", text: "Aceito mas não me preparo, achando que vai dar certo.", isCorrect: false, feedback: "Falta de preparação pode confirmar seus medos desnecessariamente." },
      { id: "d", text: "Peço para alguém ir no meu lugar.", isCorrect: false, feedback: "Ceder sua oportunidade por insegurança limita seu crescimento." },
    ],
  },
  {
    id: 13,
    scenario: "Durante a Copa do Mundo feminina, colegas de trabalho fazem piadas dizendo que 'futebol feminino é amador'.",
    options: [
      { id: "a", text: "Rio junto para não ser a 'chata'.", isCorrect: false, feedback: "Rir de preconceito para se encaixar compromete seus valores." },
      { id: "b", text: "Compartilho dados e fatos sobre o crescimento do futebol feminino com respeito.", isCorrect: true, feedback: "Informar com respeito combate ignorância e promove igualdade." },
      { id: "c", text: "Ignoro e mudo de assunto.", isCorrect: false, feedback: "Silêncio pode ser interpretado como concordância." },
      { id: "d", text: "Ataco quem fez a piada.", isCorrect: false, feedback: "Agressividade fecha portas para o diálogo construtivo." },
    ],
  },
  {
    id: 14,
    scenario: "Você está grávida e quer continuar indo aos jogos, mas todos dizem que é perigoso e irresponsável.",
    options: [
      { id: "a", text: "Paro de ir aos jogos até o bebê nascer.", isCorrect: false, feedback: "Seguir opinião alheia sem consultar um médico não é o ideal." },
      { id: "b", text: "Consulto meu médico e tomo uma decisão informada sobre o que é seguro.", isCorrect: true, feedback: "Decisões sobre saúde devem ser baseadas em orientação médica, não em opiniões." },
      { id: "c", text: "Vou a todos os jogos sem considerar riscos.", isCorrect: false, feedback: "Ignorar riscos potenciais durante a gravidez pode ser perigoso." },
      { id: "d", text: "Fico com raiva de quem opina.", isCorrect: false, feedback: "As pessoas podem estar genuinamente preocupadas, mesmo que erradas." },
    ],
  },
  {
    id: 15,
    scenario: "Você descobriu que ganha menos que colegas homens no mesmo cargo em um clube de futebol.",
    options: [
      { id: "a", text: "Aceito porque é assim que funciona.", isCorrect: false, feedback: "Aceitar desigualdade salarial perpetua a injustiça." },
      { id: "b", text: "Documento a situação e busco canais adequados para reivindicar igualdade.", isCorrect: true, feedback: "Lutar por igualdade salarial com evidências é um direito fundamental." },
      { id: "c", text: "Peço demissão imediatamente.", isCorrect: false, feedback: "Sair sem lutar não resolve o problema sistêmico." },
      { id: "d", text: "Reclamo informalmente sem documentar.", isCorrect: false, feedback: "Sem documentação, fica difícil provar e resolver a questão." },
    ],
  },
  {
    id: 16,
    scenario: "Sua amiga começou a apostar compulsivamente em jogos de futebol e está mentindo sobre o quanto gasta.",
    options: [
      { id: "a", text: "Não é da minha conta.", isCorrect: false, feedback: "Indiferença pode permitir que o problema se agrave." },
      { id: "b", text: "Converso com ela em particular, expresso preocupação e sugiro buscar ajuda.", isCorrect: true, feedback: "Cuidado genuíno e sugestão de ajuda profissional pode salvar alguém." },
      { id: "c", text: "Conto pra família dela sem avisar.", isCorrect: false, feedback: "Expor sem consentimento pode quebrar a confiança e piorar a situação." },
      { id: "d", text: "Aposto junto para acompanhá-la.", isCorrect: false, feedback: "Participar do comportamento de risco não é solidariedade." },
    ],
  },
  {
    id: 17,
    scenario: "Você se sente sozinha porque nenhuma das suas amigas gosta de futebol. Elas não entendem sua paixão.",
    options: [
      { id: "a", text: "Abandono o futebol para me encaixar.", isCorrect: false, feedback: "Abrir mão do que você ama para agradar outros prejudica sua autenticidade." },
      { id: "b", text: "Busco comunidades de torcedoras e mantenho minhas amizades existentes.", isCorrect: true, feedback: "Diversificar seus círculos sociais sem abandonar os antigos é o equilíbrio ideal." },
      { id: "c", text: "Forço minhas amigas a assistir jogos.", isCorrect: false, feedback: "Forçar interesses nos outros gera resistência e afastamento." },
      { id: "d", text: "Me afasto das amigas por me sentir incompreendida.", isCorrect: false, feedback: "Amizades vão além de interesses em comum — não vale perder por isso." },
    ],
  },
  {
    id: 18,
    scenario: "No estádio, você é a única mulher em um setor masculino. Sente olhares e desconforto.",
    options: [
      { id: "a", text: "Nunca mais vou a esse setor.", isCorrect: false, feedback: "Evitar espaços por medo limita sua liberdade." },
      { id: "b", text: "Me posiciono com confiança e, se necessário, busco a equipe de segurança.", isCorrect: true, feedback: "Ocupar espaços com confiança e ter apoio de segurança é seu direito." },
      { id: "c", text: "Peço para meu namorado ir comigo na próxima.", isCorrect: false, feedback: "Você não precisa de presença masculina para se sentir segura." },
      { id: "d", text: "Fico calada e torço baixinho.", isCorrect: false, feedback: "Silenciar sua torcida por medo prejudica sua experiência." },
    ],
  },
  {
    id: 19,
    scenario: "Você é técnica de um time feminino sub-17 e pais querem que você 'pega mais leve' com as meninas porque 'são frágeis'.",
    options: [
      { id: "a", text: "Reduzo a intensidade do treino.", isCorrect: false, feedback: "Tratar meninas como frágeis prejudica seu desenvolvimento atlético." },
      { id: "b", text: "Explico minha metodologia e mostro que treino adequado desenvolve atletas fortes.", isCorrect: true, feedback: "Educar pais e manter padrões profissionais beneficia as atletas." },
      { id: "c", text: "Ignoro os pais completamente.", isCorrect: false, feedback: "Ignorar a comunidade pode gerar mais resistência." },
      { id: "d", text: "Peço demissão por falta de apoio.", isCorrect: false, feedback: "Desistir não muda a mentalidade e as meninas perdem uma referência." },
    ],
  },
  {
    id: 20,
    scenario: "Você se sente culpada por deixar os filhos com alguém para ir ao estádio. Seu marido nunca sente essa culpa.",
    options: [
      { id: "a", text: "Paro de ir aos jogos até eles crescerem.", isCorrect: false, feedback: "Abrir mão do seu lazer por culpa não é saudável nem sustentável." },
      { id: "b", text: "Reconheço que essa culpa é social, converso com meu parceiro sobre divisão justa.", isCorrect: true, feedback: "Questionar a culpa materna e dividir responsabilidades é libertador." },
      { id: "c", text: "Levo as crianças mesmo sendo perigoso ou inadequado.", isCorrect: false, feedback: "Levar crianças sem condições adequadas não é a solução." },
      { id: "d", text: "Me sinto culpada mas vou mesmo assim sem resolver o sentimento.", isCorrect: false, feedback: "Ir com culpa constante não permite que você aproveite o momento." },
    ],
  },
];

const Quiz = () => {
  const [category, setCategory] = useState<"homens" | "mulheres" | "ludopatia" | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions =
    category === "homens"
      ? questionsHomens
      : category === "mulheres"
      ? questionsMulheres
      : questionsLudopatia;
  const question = questions[currentQuestion];

  const handleOptionSelect = (optionId: string) => {
    if (showFeedback) return;
    setSelectedOption(optionId);
    setShowFeedback(true);

    const option = question.options.find((o) => o.id === optionId);
    if (option?.isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCategory(null);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 px-4">
        {!category && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-quiz/20 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-quiz" />
              </div>
              <h1 className="font-display text-4xl text-primary mb-2">
                Resenha Fanática
              </h1>
              <p className="text-muted-foreground">
                Treine suas habilidades de escuta e comunicação
              </p>
            </div>

            <p className="text-card-foreground text-center mb-8">
              Escolha uma categoria para começar:
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setCategory("homens")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👨</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-card-foreground group-hover:text-primary transition-colors">
                      Papo de Arquibancada
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Cenários focados em comunicação masculina
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </button>

              <button
                onClick={() => setCategory("mulheres")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">👩</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-card-foreground group-hover:text-primary transition-colors">
                      Torcida Delas
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Cenários focados em comunicação feminina
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </button>

              <button
                onClick={() => setCategory("ludopatia")}
                className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🎰</span>
                  <div className="flex-1">
                    <h2 className="font-display text-2xl text-card-foreground group-hover:text-primary transition-colors">
                      Bet vs Consequências
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Cenários focados no vício em apostas
                    </p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-primary" />
                </div>
              </button>
            </div>
          </div>
        )}

        {category && !finished && question && (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-muted-foreground text-sm">
                {currentQuestion + 1}/{questions.length}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Scenario */}
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-display text-xl text-card-foreground mb-4">
                Cenário
              </h2>
              <p className="text-card-foreground leading-relaxed">
                {question.scenario}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const correctOption = question.options.find((o) => o.isCorrect);
                
                let borderClass = "border-border hover:border-primary";
                let bgClass = "bg-card";
                
                if (showFeedback) {
                  if (option.isCorrect) {
                    // Always show correct answer in green when feedback is shown
                    borderClass = "border-secondary border-2";
                    bgClass = "bg-secondary/20";
                  } else if (isSelected && !option.isCorrect) {
                    // Show selected wrong answer in red
                    borderClass = "border-destructive border-2";
                    bgClass = "bg-destructive/20";
                  }
                }

                return (
                  <div key={option.id}>
                    <button
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full text-left border rounded-xl p-4 transition-colors ${bgClass} ${borderClass}`}
                    >
                      <span className="text-card-foreground">{option.text}</span>
                    </button>
                    
                    {/* Feedback below the selected option */}
                    {showFeedback && isSelected && (
                      <div className={`mt-2 p-3 rounded-lg animate-fade-in ${
                        option.isCorrect 
                          ? "bg-secondary/10 border border-secondary/30" 
                          : "bg-destructive/10 border border-destructive/30"
                      }`}>
                        <p className={`text-sm ${option.isCorrect ? "text-secondary" : "text-destructive"}`}>
                          {option.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Button */}
            {showFeedback && (
              <button
                onClick={handleNext}
                className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
              >
                {currentQuestion < questions.length - 1 ? "Próxima" : "Ver Resultado"}
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="animate-fade-in text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-primary" />
            </div>

            <h1 className="font-display text-4xl text-primary mb-4">
              Parabéns!
            </h1>

            <p className="text-card-foreground text-xl mb-2">
              Você acertou{" "}
              <span className="text-primary font-bold">{score}</span> de{" "}
              <span className="text-primary font-bold">{questions.length}</span>{" "}
              questões
            </p>

            <p className="text-muted-foreground mb-8">
              Continue praticando para melhorar suas habilidades!
            </p>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 mx-auto py-4 px-8 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-wide hover:scale-[1.02] transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
              Jogar Novamente
            </button>
          </div>
        )}

        {/* Spacer para manter distância do BottomNav */}
        <div aria-hidden className="h-28" />
      </main>

      <BottomNav />
    </div>
  );
};

export default Quiz;
