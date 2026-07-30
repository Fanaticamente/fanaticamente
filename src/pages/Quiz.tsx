import { useState } from "react";
import { ChevronRight, RotateCcw, Trophy } from "lucide-react";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import resenhaLaEles from "@/assets/resenha-deles-v2.png.asset.json";
import resenhaLaElas from "@/assets/resenha-delas-v2.png.asset.json";
import resenhaBet from "@/assets/resenha-bet.png.asset.json";
import resenhaFanaticaLogo from "@/assets/resenha-fanatica-logo.png.asset.json";

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

const CategoryButton = ({
  image,
  alt,
  onClick,
}: {
  image: string;
  alt: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="block relative w-full overflow-hidden rounded-2xl h-32 sm:h-40 group bg-slate-100 shadow-sm"
  >
    <img
      src={image}
      alt={alt}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
    {/* Tint the green banner background with the user's club color while
        preserving the illustration details (mix-blend-hue keeps saturation
        and luminosity from the image, replacing only the hue). */}
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none"
      style={{ background: "var(--club-500)", mixBlendMode: "hue" }}
    />
    <div className="absolute right-4 top-1/2 -translate-y-1/2">
      <ChevronRight className="w-6 h-6 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);


const questionsLudopatia: Question[] = [
  {
    id: 1,
    scenario: "Você percebe que abre o app da casa de apostas várias vezes ao dia, mesmo sem ter dinheiro para apostar.",
    options: [
      { id: "a", text: "É só curiosidade, todo mundo faz isso.", isCorrect: false, feedback: "Checagem compulsiva é um sinal precoce de comportamento aditivo." },
      { id: "b", text: "Reconheço o padrão e desinstalo o app por um período.", isCorrect: true, feedback: "Reduzir gatilhos é uma estratégia eficaz para interromper o ciclo do vício." },
      { id: "c", text: "Continuo abrindo, afinal não estou apostando.", isCorrect: false, feedback: "A exposição constante mantém o cérebro em estado de antecipação e recompensa." },
      { id: "d", text: "Aposto só um valor mínimo para não 'desperdiçar' a checagem.", isCorrect: false, feedback: "Esse pensamento racionaliza o comportamento e alimenta o ciclo." },
    ],
  },
  {
    id: 2,
    scenario: "Sua amiga conta que está apostando o salário inteiro em jogos online e pede que você guarde segredo da família dela.",
    options: [
      { id: "a", text: "Concordo em guardar segredo, é a vida dela.", isCorrect: false, feedback: "Manter sigilo sobre vício pode agravar o problema e prejudicar quem ama." },
      { id: "b", text: "Ofereço apoio, mas digo que a família precisa saber para ajudar.", isCorrect: true, feedback: "Quebrar o isolamento é fundamental no tratamento da ludopatia." },
      { id: "c", text: "Conto para todo mundo imediatamente.", isCorrect: false, feedback: "Expor sem consentimento quebra a confiança e pode afastar quem precisa de ajuda." },
      { id: "d", text: "Empresto dinheiro para ela cobrir o salário gasto.", isCorrect: false, feedback: "Cobrir as perdas perpetua o ciclo e atrasa a busca por ajuda." },
    ],
  },
  {
    id: 3,
    scenario: "Você ganhou uma aposta grande e sente uma euforia intensa, com vontade de apostar tudo de novo.",
    options: [
      { id: "a", text: "Aposto tudo, estou na maré boa.", isCorrect: false, feedback: "A 'maré boa' é uma ilusão cognitiva — as casas sempre têm vantagem matemática." },
      { id: "b", text: "Saco o dinheiro, paro por hoje e observo essa euforia.", isCorrect: true, feedback: "Reconhecer a euforia como gatilho é parte central do autocuidado." },
      { id: "c", text: "Aumento o valor das apostas para multiplicar o ganho.", isCorrect: false, feedback: "Aumentar o valor após ganhar é um padrão clássico do comportamento aditivo." },
      { id: "d", text: "Comemoro postando nas redes sociais.", isCorrect: false, feedback: "Glamourizar apostas pode influenciar negativamente pessoas vulneráveis ao seu redor." },
    ],
  },
  {
    id: 4,
    scenario: "Você está devendo o aluguel porque gastou em apostas. Surge a ideia de pegar um empréstimo para 'recuperar' o dinheiro apostando.",
    options: [
      { id: "a", text: "Pego o empréstimo, com uma aposta certeira eu resolvo.", isCorrect: false, feedback: "Esse é o 'chasing losses', um dos critérios diagnósticos da ludopatia." },
      { id: "b", text: "Paro de apostar, converso com o senhorio e procuro ajuda especializada.", isCorrect: true, feedback: "Enfrentar a realidade financeira e buscar tratamento é o caminho saudável." },
      { id: "c", text: "Peço dinheiro emprestado para um familiar sem contar o motivo real.", isCorrect: false, feedback: "Esconder o uso do dinheiro mantém o vício e corrói relações." },
      { id: "d", text: "Faço uma aposta pequena 'só para tentar a sorte'.", isCorrect: false, feedback: "Apostar para resolver dívidas de apostas é a definição do ciclo vicioso." },
    ],
  },
  {
    id: 5,
    scenario: "Seu colega de trabalho passa o expediente inteiro analisando odds e fazendo apostas ao vivo no celular.",
    options: [
      { id: "a", text: "Faço junto, parece divertido.", isCorrect: false, feedback: "Aderir ao comportamento aumenta o risco de você desenvolver o mesmo problema." },
      { id: "b", text: "Demonstro preocupação genuína e ofereço escuta sem julgar.", isCorrect: true, feedback: "Apoio sem julgamento abre espaço para a pessoa reconhecer o problema." },
      { id: "c", text: "Ignoro, cada um faz o que quer.", isCorrect: false, feedback: "Indiferença diante de sinais de vício é uma forma de omissão." },
      { id: "d", text: "Denuncio para o chefe imediatamente.", isCorrect: false, feedback: "Punir sem oferecer ajuda raramente resolve um problema de saúde mental." },
    ],
  },
  {
    id: 6,
    scenario: "Você nota que só consegue 'curtir' o jogo do seu time se tiver dinheiro apostado no resultado.",
    options: [
      { id: "a", text: "É assim que fica mais emocionante mesmo.", isCorrect: false, feedback: "Precisar de aposta para sentir prazer é sinal de tolerância, um critério de vício." },
      { id: "b", text: "Reflito sobre essa dependência e busco resgatar o prazer pelo esporte em si.", isCorrect: true, feedback: "Reconectar com o significado original do hobby é parte da recuperação." },
      { id: "c", text: "Aposto valores cada vez maiores para manter a emoção.", isCorrect: false, feedback: "Escalada de valores para manter o estímulo é característica do vício." },
      { id: "d", text: "Paro de assistir aos jogos para não apostar.", isCorrect: false, feedback: "Evitar sem tratar a causa pode funcionar a curto prazo, mas não resolve a raiz." },
    ],
  },
  {
    id: 7,
    scenario: "Influenciadores que você segue vivem postando 'green' de apostas e promovendo casas de bet.",
    options: [
      { id: "a", text: "Sigo as dicas, eles entendem do assunto.", isCorrect: false, feedback: "Influenciadores raramente mostram as perdas e geralmente são pagos para divulgar." },
      { id: "b", text: "Deixo de seguir e busco conteúdo que não estimule apostas.", isCorrect: true, feedback: "Curar o feed reduz gatilhos e protege sua saúde mental e financeira." },
      { id: "c", text: "Continuo seguindo, mas aposto valores menores.", isCorrect: false, feedback: "A exposição contínua mantém o desejo ativo, independente do valor." },
      { id: "d", text: "Tento ser influenciador de apostas também.", isCorrect: false, feedback: "Lucrar incentivando vício de outras pessoas é eticamente problemático." },
    ],
  },
  {
    id: 8,
    scenario: "Seu parceiro ou parceira descobre suas dívidas com apostas e fica devastado(a). Você sente vergonha e vontade de mentir.",
    options: [
      { id: "a", text: "Minto sobre o valor real para diminuir o impacto.", isCorrect: false, feedback: "Mentir agrava a quebra de confiança quando a verdade vier à tona." },
      { id: "b", text: "Assumo tudo com honestidade e proponho buscar ajuda em conjunto.", isCorrect: true, feedback: "Transparência e responsabilização são essenciais para reconstruir a relação." },
      { id: "c", text: "Culpo o estresse do trabalho pelas apostas.", isCorrect: false, feedback: "Transferir a responsabilidade impede a tomada de consciência sobre o vício." },
      { id: "d", text: "Prometo parar, mas continuo escondido.", isCorrect: false, feedback: "Promessas vazias quebram ainda mais a confiança e mantêm o ciclo." },
    ],
  },
  {
    id: 9,
    scenario: "Você sente um alívio enorme só de pensar em fazer uma aposta quando está ansioso ou triste.",
    options: [
      { id: "a", text: "Aposto sempre que estou mal, é minha válvula de escape.", isCorrect: false, feedback: "Usar apostas para regular emoções é um forte preditor de dependência." },
      { id: "b", text: "Procuro um(a) psicólogo(a) para tratar a ansiedade na raiz.", isCorrect: true, feedback: "Tratar a causa emocional reduz a necessidade do comportamento aditivo." },
      { id: "c", text: "Combino apostas com bebida para amplificar o alívio.", isCorrect: false, feedback: "Associar substâncias e apostas multiplica os riscos à saúde." },
      { id: "d", text: "Tento controlar sozinho 'na força de vontade'.", isCorrect: false, feedback: "Vício é doença, não falta de força de vontade — ajuda profissional é essencial." },
    ],
  },
  {
    id: 10,
    scenario: "Seu filho ou filha adolescente te pede ajuda para criar conta em uma casa de apostas.",
    options: [
      { id: "a", text: "Ajudo, é melhor que aprenda comigo do que sozinho.", isCorrect: false, feedback: "Apostas são proibidas para menores e expor adolescentes aumenta o risco de vício." },
      { id: "b", text: "Recuso e converso abertamente sobre os riscos da ludopatia.", isCorrect: true, feedback: "Diálogo informativo é a melhor prevenção em idades vulneráveis." },
      { id: "c", text: "Permito uma aposta pequena 'para ver como funciona'.", isCorrect: false, feedback: "Primeiras experiências precoces aumentam significativamente o risco futuro." },
      { id: "d", text: "Ignoro o pedido sem explicar nada.", isCorrect: false, feedback: "Sem explicação, ele(a) provavelmente vai tentar por conta própria." },
    ],
  },
  {
    id: 11,
    scenario: "Você descobre que mente para amigos sobre o quanto realmente gasta em apostas.",
    options: [
      { id: "a", text: "Sigo mentindo, ninguém precisa saber.", isCorrect: false, feedback: "Mentir sobre o vício é um critério diagnóstico clássico da ludopatia." },
      { id: "b", text: "Encaro a mentira como um sinal de alerta e procuro ajuda.", isCorrect: true, feedback: "Reconhecer padrões disfuncionais é o primeiro passo para mudar." },
      { id: "c", text: "Diminuo o valor real quando perguntam.", isCorrect: false, feedback: "Minimizar é uma forma de negação que mantém o problema invisível." },
      { id: "d", text: "Mudo de assunto sempre que alguém toca no tema.", isCorrect: false, feedback: "Evitar conversas sobre o tema impede o suporte que você precisa." },
    ],
  },
  {
    id: 12,
    scenario: "Você perdeu o sono pensando em uma aposta perdida ontem e em como recuperar hoje.",
    options: [
      { id: "a", text: "Levanto e aposto agora mesmo para resolver.", isCorrect: false, feedback: "Decisões financeiras feitas em estado emocional alterado tendem a ser piores." },
      { id: "b", text: "Reconheço a obsessão como sintoma e procuro uma linha de apoio.", isCorrect: true, feedback: "Linhas de apoio (como Jogadores Anônimos) oferecem suporte imediato e gratuito." },
      { id: "c", text: "Tomo bebida para conseguir dormir.", isCorrect: false, feedback: "Substâncias mascaram o sintoma e podem gerar nova dependência." },
      { id: "d", text: "Faço apostas pequenas em jogos asiáticos para 'passar o tempo'.", isCorrect: false, feedback: "Apostar para regular a insônia perpetua o ciclo do vício." },
    ],
  },
  {
    id: 13,
    scenario: "Um amigo seu, que se autodeclara em recuperação da ludopatia, te chama para 'fazer só uma aposta juntos pela diversão'.",
    options: [
      { id: "a", text: "Aceito, é só uma vez.", isCorrect: false, feedback: "Reforçar uma recaída prejudica seriamente quem está em recuperação." },
      { id: "b", text: "Recuso com carinho e proponho outra atividade juntos.", isCorrect: true, feedback: "Apoiar a abstinência de um amigo é proteger a recuperação dele." },
      { id: "c", text: "Aposto sozinho depois para não influenciar ele.", isCorrect: false, feedback: "O comportamento ao redor pode ser gatilho mesmo sem ele participar." },
      { id: "d", text: "Faço sermão sobre o vício dele.", isCorrect: false, feedback: "Julgamento moralista raramente ajuda quem luta contra um vício." },
    ],
  },
  {
    id: 14,
    scenario: "Você percebe que está negligenciando o trabalho, os estudos ou a família por causa do tempo gasto apostando.",
    options: [
      { id: "a", text: "Compenso fazendo mais apostas para ganhar e justificar o tempo.", isCorrect: false, feedback: "Justificar o vício com resultados financeiros é uma armadilha cognitiva." },
      { id: "b", text: "Faço um inventário honesto dos prejuízos e busco tratamento.", isCorrect: true, feedback: "Mapear os danos concretos motiva a mudança e orienta o tratamento." },
      { id: "c", text: "Reduzo o tempo, mas mantenho a frequência das apostas.", isCorrect: false, feedback: "Redução parcial sem tratamento costuma evoluir de volta ao padrão antigo." },
      { id: "d", text: "Culpo o trabalho ou os estudos por serem 'chatos'.", isCorrect: false, feedback: "Externalizar a culpa impede que você assuma a responsabilidade pela mudança." },
    ],
  },
  {
    id: 15,
    scenario: "Você recebe muitas notificações de bônus, giros grátis e 'apostas seguras' das casas de apostas.",
    options: [
      { id: "a", text: "Aproveito todos os bônus, é dinheiro fácil.", isCorrect: false, feedback: "Bônus são desenhados para te manter ativo na plataforma — não existe 'dinheiro fácil'." },
      { id: "b", text: "Desativo as notificações e me autoexcluo das plataformas.", isCorrect: true, feedback: "Autoexclusão é uma ferramenta legítima e poderosa para quebrar o ciclo." },
      { id: "c", text: "Uso só os bônus, sem depositar nada.", isCorrect: false, feedback: "Bônus exigem rollover e quase sempre acabam te levando a depositar." },
      { id: "d", text: "Repasso as 'dicas' para amigos.", isCorrect: false, feedback: "Disseminar conteúdo de apostas pode arrastar outras pessoas para o vício." },
    ],
  },
  {
    id: 16,
    scenario: "Você teve pensamentos de que sua vida seria melhor sem você, em parte por causa das dívidas de apostas.",
    options: [
      { id: "a", text: "Tento esquecer fazendo mais apostas.", isCorrect: false, feedback: "Pensamentos de morte exigem atenção imediata, não distração com o gatilho." },
      { id: "b", text: "Procuro ajuda agora — ligo para o CVV (188) ou vou ao CAPS mais próximo.", isCorrect: true, feedback: "Pensamentos suicidas são emergência de saúde — apoio profissional é essencial e gratuito." },
      { id: "c", text: "Guardo para mim, é vergonha demais.", isCorrect: false, feedback: "Falar é proteger sua vida. Vergonha não deve impedir você de buscar ajuda." },
      { id: "d", text: "Posto nas redes de forma vaga.", isCorrect: false, feedback: "Sinais vagos podem não ser percebidos a tempo — busque ajuda direta e profissional." },
    ],
  },
  {
    id: 17,
    scenario: "Você tenta parar de apostar por conta própria e sente irritabilidade, inquietação e desejo intenso.",
    options: [
      { id: "a", text: "Volto a apostar para aliviar o mal-estar.", isCorrect: false, feedback: "Esses sintomas de abstinência confirmam o vício — recaída piora o quadro." },
      { id: "b", text: "Procuro Jogadores Anônimos ou tratamento especializado em CAPS-AD.", isCorrect: true, feedback: "Apoio profissional e grupos de apoio aumentam muito as chances de abstinência." },
      { id: "c", text: "Substituo apostas por outro comportamento de risco.", isCorrect: false, feedback: "Trocar um vício por outro não resolve a raiz e cria novos problemas." },
      { id: "d", text: "Aguento sozinho 'até passar'.", isCorrect: false, feedback: "Tentar sozinho aumenta o risco de recaída — ajuda especializada faz diferença." },
    ],
  },
  {
    id: 18,
    scenario: "Sua mãe ou seu pai começou a apostar muito depois da aposentadoria e está perdendo as economias.",
    options: [
      { id: "a", text: "Não me meto, é a vida dele(a).", isCorrect: false, feedback: "Idosos são especialmente vulneráveis e podem perder tudo rapidamente." },
      { id: "b", text: "Converso com afeto, ofereço acompanhamento médico e psicológico.", isCorrect: true, feedback: "Acolher e propor ajuda profissional respeita a autonomia e protege a pessoa." },
      { id: "c", text: "Tomo o celular dele(a) à força.", isCorrect: false, feedback: "Atitudes autoritárias geram resistência e podem afastar a pessoa do apoio." },
      { id: "d", text: "Aposto junto para 'controlar' os gastos.", isCorrect: false, feedback: "Participar do comportamento valida e reforça o vício." },
    ],
  },
  {
    id: 19,
    scenario: "Você está prestes a receber o salário e já planejou exatamente em quais apostas vai colocar boa parte dele.",
    options: [
      { id: "a", text: "Sigo o plano, já calculei tudo.", isCorrect: false, feedback: "Planejar o salário em torno de apostas é sinal claro de comprometimento financeiro." },
      { id: "b", text: "Reconheço o sinal, transfiro o salário para uma conta de difícil acesso e busco ajuda.", isCorrect: true, feedback: "Criar barreiras práticas reduz a impulsividade enquanto você inicia o tratamento." },
      { id: "c", text: "Aposto só metade, para 'controlar'.", isCorrect: false, feedback: "Ideia de controle parcial é típica da fase de negação do vício." },
      { id: "d", text: "Faço empréstimo extra para apostar ainda mais.", isCorrect: false, feedback: "Endividar-se para apostar é um dos comportamentos de maior risco." },
    ],
  },
  {
    id: 20,
    scenario: "Alguém próximo te diz: 'Acho que você tem um problema com apostas.' Você sente raiva imediata.",
    options: [
      { id: "a", text: "Discuto e digo que essa pessoa não entende nada da minha vida.", isCorrect: false, feedback: "Reação defensiva intensa muitas vezes confirma o que está sendo apontado." },
      { id: "b", text: "Respiro, escuto e considero seriamente buscar uma avaliação profissional.", isCorrect: true, feedback: "Acolher o feedback de quem te ama é um passo corajoso rumo à mudança." },
      { id: "c", text: "Corto contato com quem comentou.", isCorrect: false, feedback: "Isolar-se de quem se preocupa só fortalece o vício." },
      { id: "d", text: "Concordo só para encerrar a conversa, sem fazer nada.", isCorrect: false, feedback: "Concordância vazia sem ação é uma forma de manter o problema." },
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
      void (async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from("quiz_completions").insert({
            user_id: user.id,
            quiz_key: category,
            score,
            total: questions.length,
          });
          if (!error) {
            toast.success("Atividade concluída! +1 ponto no ranking");
          }
        } catch {}
      })();
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
    <div className="min-h-screen bg-white text-slate-900 font-sans normal-case">
      <Header title="Atividades" hideSearch />

      <main className="pt-[calc(56px+1cm)] px-4">
        {!category && (
          <div className="animate-fade-in">
            <div className="text-center mb-6">
              <h1 className="font-sans text-2xl font-bold text-slate-900 mb-1" style={{ textTransform: "none" }}>
                Resenha Fanática
              </h1>
              <p className="text-sm text-slate-500">Escolha uma categoria para começar</p>
            </div>

            <div className="space-y-4">
              <CategoryButton
                image={resenhaLaEles.url}
                alt="Lá Eles - Cenários focados na comunicação masculina"
                onClick={() => setCategory("homens")}
              />

              <CategoryButton
                image={resenhaLaElas.url}
                alt="Lá Elas - Cenários focados na comunicação feminina"
                onClick={() => setCategory("mulheres")}
              />

              <CategoryButton
                image={resenhaBet.url}
                alt="Bet vs Consequências - Cenários focados no vício em apostas"
                onClick={() => setCategory("ludopatia")}
              />

            </div>
          </div>
        )}

        {category && !finished && question && (
          <div className="animate-fade-in">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-slate-500 text-sm">
                {currentQuestion + 1}/{questions.length}
              </span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    background: "var(--club-600)",
                  }}
                />
              </div>
            </div>

            {/* Scenario */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mb-6">
              <h2 className="font-sans text-lg font-semibold text-slate-900 mb-3" style={{ textTransform: "none" }}>
                Cenário
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {question.scenario}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.id;
                const correctOption = question.options.find((o) => o.isCorrect);
                
                let borderClass = "border-slate-200 hover:border-[var(--club-500)]";
                let bgClass = "bg-white";
                
                if (showFeedback) {
                  if (option.isCorrect) {
                    borderClass = "border-green-600 border-2";
                    bgClass = "bg-green-50";
                  } else if (isSelected && !option.isCorrect) {
                    borderClass = "border-red-500 border-2";
                    bgClass = "bg-red-50";
                  }
                }

                return (
                  <div key={option.id}>
                    <button
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={showFeedback}
                      className={`w-full text-left border rounded-xl p-4 transition-colors ${bgClass} ${borderClass}`}
                    >
                      <span className="text-slate-800">{option.text}</span>
                    </button>
                    
                    {/* Feedback below the selected option */}
                    {showFeedback && isSelected && (
                      <div className={`mt-2 p-3 rounded-lg animate-fade-in ${
                        option.isCorrect 
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}>
                        <p className={`text-sm ${option.isCorrect ? "text-green-700" : "text-red-700"}`}>
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
                className="w-full py-3 text-white rounded-xl font-semibold transition-colors"
                style={{ textTransform: "none", background: "var(--club-600)" }}
              >
                {currentQuestion < questions.length - 1 ? "Próxima" : "Ver Resultado"}
              </button>
            )}
          </div>
        )}

        {finished && (
          <div className="animate-fade-in text-center">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "var(--club-50)" }}
            >
              <Trophy className="w-12 h-12" style={{ color: "var(--club-600)" }} />
            </div>

            <h1 className="font-sans text-3xl font-bold text-slate-900 mb-4" style={{ textTransform: "none" }}>
              Parabéns!
            </h1>

            <p className="text-slate-700 text-lg mb-2">
              Você acertou{" "}
              <span className="font-bold" style={{ color: "var(--club-600)" }}>{score}</span> de{" "}
              <span className="font-bold" style={{ color: "var(--club-600)" }}>{questions.length}</span>{" "}
              questões
            </p>

            <p className="text-slate-500 mb-8">
              Continue praticando para melhorar suas habilidades!
            </p>

            <button
              onClick={handleRestart}
              className="flex items-center justify-center gap-2 mx-auto py-3 px-8 text-white rounded-xl font-semibold transition-colors"
              style={{ textTransform: "none", background: "var(--club-600)" }}
            >
              <RotateCcw className="w-5 h-5" />
              Jogar novamente
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
