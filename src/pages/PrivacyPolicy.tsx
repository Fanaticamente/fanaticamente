import { cn } from "@/lib/utils";
import LegalDocumentView from "@/components/legal/LegalDocumentView";

const PrivacyPolicyFallback = () => (
  <div className={cn("prose prose-sm max-w-none text-black break-words", "overflow-x-hidden")}>
            <h1 className="text-2xl font-bold text-black mb-6">
              POLÍTICA DE PRIVACIDADE E TRATAMENTO DE DADOS DO FANATICAMENTE
            </h1>

            {/* 1. Informações Gerais */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">1. Informações Gerais</h2>

              <p className="mb-4">
                <strong>1.1.</strong> A presente Política tem por finalidade demonstrar o compromisso da FANATICAMENTE TECNOLOGIA E SERVIÇOS LTDA. ("Nós"), com sede no estado de Santa Catarina, município de Florianópolis, na Rua Tenente Silveira, 584, andar 7º, Centro, CEP 88010301, CNPJ: 56.605.156/0001-50 com a sua privacidade e a proteção dos seus dados, de forma clara e de acordo com as leis em vigor.
              </p>

              <p className="mb-4">
                <strong>1.2.</strong> Esta Política descreve as principais regras sobre o tratamento dos Dados Pessoais do Usuário Final e do Profissional Parceiro, em conjunto denominados "Usuário", quando interagem conosco em nossos ambientes digitais, por meio dos serviços e funcionalidades do nosso site, seus subdomínios e aplicativos, disponíveis através do link www.fanaticamente.com/ ("Site", "Aplicativo" ou "Nossos Ambientes").
              </p>

              <p className="mb-4">
                <strong>1.3.</strong> Assim, como condição para utilização das funcionalidades ofertadas em Nossos Ambientes, o Usuário declara que fez a leitura completa e atenta desta Política, conferindo, assim, sua livre e expressa concordância com os termos aqui estipulados, incluindo o tratamento dos Dados aqui mencionados, bem como sua utilização para os fins abaixo especificados.
              </p>

              <p className="mb-4">
                <strong>1.4.</strong> Esta Política poderá ser atualizada, razão pela qual convidamos o Usuário a consultá-la periodicamente. Além disso, caso o Usuário não esteja de acordo com as disposições desta Política, deverá descontinuar o acesso e uso do nosso site e/ou aplicativo.
              </p>

              <p className="mb-4">
                <strong>1.5.</strong> Papéis de tratamento (LGPD). Para dados de cadastro, uso da aplicação e métricas, o Fanaticamente atua como controlador. Para dados assistenciais decorrentes de atendimentos psicológicos (p. ex., prontuários, anotações clínicas e documentos profissionais), cada Profissional atua como controlador independente, sendo responsável por coleta, bases legais, guarda e segurança desses dados no exercício de sua atividade profissional. O Fanaticamente não presta serviços de saúde, não guarda prontuários e não tem acesso a anotações/documentos/relatórios clínicos.
              </p>

              <p className="mb-4">
                <strong>1.6.</strong> Natureza de intermediação (marketplace). O Fanaticamente opera exclusivamente como plataforma de intermediação, conectando Usuários e Profissionais. O aplicativo oferece ao usuário Profissional Parceiro, a possibilidade de vincular sua chave pix ao seu cadastro para receber pagamentos diretos dos usuários finais. Nenhum valor relacionado a consultas/atendimentos transita pela plataforma. A emissão de documentos profissionais e a prática clínica são exclusivamente conduzidos entre Usuário e Profissional, nos termos dos Termos & Condições aplicáveis.
              </p>

              <p className="mb-4">
                <strong>1.7. Perfilização/decisões automatizadas.</strong> Podemos realizar recomendações de conteúdo e organizar a exibição de perfis com base em interações e preferências (p. ex., telas acessadas, funcionalidades usadas). Não tomamos decisões automatizadas com efeitos jurídicos sobre o Usuário. Preferências podem ser gerenciadas conforme itens 2.3 e 3.7-A.
              </p>
            </section>

            {/* 2. Direitos dos Usuários */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">2. Direitos dos Usuários</h2>

              <p className="mb-4">
                <strong>2.1.</strong> É muito importante que o Usuário tenha total controle dos dados pessoais que compartilha conosco. É possível acessar ou corrigir esses dados a qualquer momento através do próprio site, aplicativo, ou entrando em contato conosco. Comprometemo-nos a fornecer acesso aos dados em até 15 (quinze) dias, além de atender, quando aplicável, correção, portabilidade, anonimização/bloqueio/eliminação, oposição, revogação de consentimento e informação sobre compartilhamentos. Solicitações podem ser feitas ao Encarregado (DPO) no canal do item 4.
              </p>

              <p className="mb-4">
                <strong>2.2.</strong> Caso o Usuário solicite a exclusão de seus Dados Pessoais, pode ocorrer que os Dados precisem ser mantidos por período superior ao pedido de exclusão, nos termos do artigo 16 da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/18), para: (i) cumprimento de obrigação legal ou regulatória; (ii) estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização dos dados pessoais; (iii) transferência a terceiro (respeitados os requisitos de tratamento de dados dispostos na mesma Lei); (iv) ou utilização de forma anonimizada para fins estatísticos.
              </p>

              <p className="mb-4">
                <strong>2.3.</strong> Comunicações e preferências. O Usuário poderá gerenciar consentimentos e optar pelo não recebimento de comunicações de marketing a qualquer tempo (links nos e-mails e controles no app). Mensagens transacionais (ex.: avisos essenciais de conta/serviço) continuarão sendo enviadas enquanto necessárias.
              </p>

              <p className="mb-4">
                <strong>2.4.</strong> ANPD. Caso não fique satisfeito com nossa resposta, o Usuário poderá apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </section>

            {/* 3. Dados Coletados */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">3. Dados Coletados</h2>

              <p className="mb-4">
                <strong>3.1.</strong> Os Dados, incluindo Dados Pessoais e Dados Pessoais Sensíveis, indicados abaixo, poderão ser tratados quando o Usuário interage conosco em nossos ambientes, sobretudo durante a utilização do site e aplicativo, com o propósito de se cadastrar como Usuário Final ou como Profissional Parceiro e acessar as funcionalidades ofertadas em nossos ambientes.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.1-A. Campos e finalidades</h3>

              <h4 className="font-semibold text-black mt-4 mb-2">Usuário Final – Dados Cadastrais</h4>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Campos (exemplos): Nome completo; E-mail; Telefone/Celular; Endereço; Gênero; Naturalidade; Nacionalidade; Data de nascimento; Origem racial/étnica (somente se opcional, com finalidade clara, podendo não ser fornecida); Time do Coração.</li>
                <li>Finalidades: (i) Identificar e autenticar o Usuário; (ii) Cumprir obrigações decorrentes dos serviços e exigências regulatórias; (iii) Ampliar relacionamento com comunicações relevantes; (iv) Personalizar funcionalidades e conteúdos na Plataforma.</li>
              </ul>

              <h4 className="font-semibold text-black mt-4 mb-2">Usuário Final – Dados Financeiros</h4>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Campos (exemplos): Número do cartão e dados correlatos; Endereço para cobrança.</li>
                <li>Finalidades: (i) a (v) acima quando e somente quando o pagamento for processado pela Plataforma. Pagamentos de consultas realizados diretamente entre Usuário e Profissional não são coletados nem geridos pelo Fanaticamente.</li>
              </ul>

              <h4 className="font-semibold text-black mt-4 mb-2">Usuário Final – Dados de Identificação Digital</h4>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Campos (exemplos): Endereço de IP e porta lógica de origem; Dispositivo e sistema operacional; Geolocalização (quando ativada/permitida); Registros de data e horário de ações; Telas acessadas; ID de sessão; Identificadores de cookies e SDKs.</li>
                <li>Finalidades: (i) Identificar e autenticar o Usuário; (ii) Cumprir obrigações decorrentes do uso da Plataforma; (iii) Atender ao Marco Civil da Internet e demais normas aplicáveis (manutenção de registros de acesso no prazo legal); (iv) Monitorar segurança, prevenir fraudes e incidentes. Controles adicionais descritos no item 3.7-A da Política.</li>
              </ul>

              <h4 className="font-semibold text-black mt-4 mb-2">Usuário Profissional Parceiro – Dados Cadastrais e Profissionais</h4>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Campos (exemplos): Nome; E-mail; RG; CPF; Data de nascimento; Gênero; Profissão; Naturalidade; Nacionalidade; Endereço; Telefone; Origem racial/étnica (somente se opcional, com finalidade clara, podendo não ser fornecida); Informações geográficas; Especialidade; Nº de registro no conselho profissional; Histórico acadêmico; Foto; Time do Coração.</li>
                <li>Finalidades: (i) Identificar e autenticar o Profissional; (ii) Cumprir obrigações decorrentes dos serviços prestados via Plataforma e obrigações regulatórias/aplicáveis ao exercício profissional; (iii) Comunicar novidades, atualizações e funcionalidades da Plataforma; (iv) Personalizar funcionalidades; (v) Promover identificação do Profissional no contexto da Plataforma (perfil público, busca etc.).</li>
              </ul>

              <h4 className="font-semibold text-black mt-4 mb-2">Usuário Profissional Parceiro – Dados Financeiros</h4>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Campos (exemplos): Dados de cartão e correlatos (quando aplicável).</li>
              </ul>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.1-B. Dados de Saúde e Bem-Estar</h3>

              <p className="mb-4">
                Nosso aplicativo pode permitir que usuários compartilhem voluntariamente informações relacionadas ao seu bem-estar emocional ou psicológico, especialmente no contexto de conexão com profissionais de psicoterapia disponíveis na plataforma.
              </p>

              <p className="mb-2">Essas informações podem incluir, por exemplo:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Relatos sobre sentimentos, emoções ou estados de humor;</li>
                <li>Informações fornecidas em formulários de triagem ou questionários;</li>
                <li>Mensagens enviadas diretamente a profissionais cadastrados na plataforma;</li>
                <li>Informações relacionadas ao acompanhamento de bem-estar emocional.</li>
              </ul>

              <h4 className="font-semibold text-black mt-4 mb-2">Como esses dados são utilizados</h4>
              <p className="mb-2">As informações relacionadas ao bem-estar emocional ou psicológico são utilizadas exclusivamente para:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Facilitar a conexão entre usuários e profissionais disponíveis na plataforma;</li>
                <li>Melhorar a experiência do usuário dentro do aplicativo;</li>
                <li>Permitir que o usuário utilize funcionalidades educacionais, questionários ou conteúdos relacionados ao bem-estar;</li>
                <li>Garantir o funcionamento adequado dos serviços oferecidos.</li>
              </ul>
              <p className="mb-4">Esses dados não são utilizados para fins de publicidade personalizada nem vendidos a terceiros.</p>

              <h4 className="font-semibold text-black mt-4 mb-2">Controle do usuário</h4>
              <p className="mb-2">O compartilhamento dessas informações é opcional e voluntário. O usuário pode escolher:</p>
              <ul className="list-disc pl-6 space-y-1 mb-4">
                <li>Não fornecer determinadas informações;</li>
                <li>Interromper o uso das funcionalidades relacionadas ao bem-estar;</li>
                <li>Solicitar a exclusão de seus dados conforme descrito nesta política.</li>
              </ul>

              <p className="mb-4">
                <strong>3.2.</strong> Muitos de nossos serviços dependem diretamente de alguns Dados informados acima, principalmente Dados Cadastrais. Caso o Usuário opte por não fornecer alguns desses Dados, podemos ficar impossibilitados de executar alguns de nossos serviços e funcionalidades em Nossos Ambientes.
              </p>

              <p className="mb-4">
                <strong>3.3.</strong> O Usuário é o único responsável pela precisão, veracidade ou falta dela em relação aos Dados que fornece, ou pela sua desatualização. Desta forma, é de sua responsabilidade garantir a exatidão ou mantê-los atualizados.
              </p>

              <p className="mb-4">
                <strong>3.3.1.</strong> Da mesma forma, Nós não somos obrigados a processar ou tratar quaisquer dos seus Dados se houver razões para crer que tal processamento ou tratamento possa nos imputar qualquer infração de qualquer lei aplicável, ou se o Usuário estiver utilizando Nossos Ambientes para quaisquer fins ilegais, ilícitos ou contrários à moralidade.
              </p>

              <p className="mb-4">
                <strong>3.4.</strong> A base de dados formada por meio da coleta de Dados é de nossa propriedade e está sob nossa responsabilidade, sendo que seu uso, acesso e compartilhamento, quando necessários, serão feitos dentro dos limites e propósitos dos negócios descritos nesta Política.
              </p>

              <p className="mb-4">
                <strong>3.5.</strong> O aplicativo usa serviços de terceiros que podem coletar informações usadas para identificá-lo, como: Supabase (autenticação, banco de dados, armazenamento de arquivos e funções serverless), Facebook Login (login social, quando habilitado), Google Login (login social, quando habilitado), Google Play Services (criação/funcionamento do app em dispositivos Android), Apple Sign In (login social em dispositivos iOS, quando habilitado) e Google Analytics ou equivalente (métricas e análise de uso, quando configurado). Esses terceiros têm acesso a certos dados pessoais para executar tarefas em nosso nome e não podem usá-los para outras finalidades. Também podemos compartilhar informações pessoais de usuários com empresas, organizações ou indivíduos externos se, de boa-fé, for necessário para: (i) cumprir legislação/ordem judicial/solicitação governamental; (ii) cumprir Termos de Serviço (incluindo investigação de violações); (iii) detectar/prevenir fraudes ou incidentes de segurança; (iv) proteger direitos, propriedade ou segurança dos usuários ou do público.
              </p>

              <p className="mb-4">
                <strong>3.5.1.</strong> Sempre que você usar os nossos Serviços, coletamos dados de registro (identificadores online/cookies, IP, identificadores de dispositivo).
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.5.2. Transferência internacional</h3>
              <p className="mb-4">
                Os serviços de hospedagem e servidores podem não estar localizados no território brasileiro. A infraestrutura de backend é provida pela Supabase, cujos servidores podem estar localizados nos Estados Unidos ou em outras regiões. Sempre que transferirmos informações pessoais para outras jurisdições, adotaremos cláusulas contratuais e salvaguardas adequadas, garantindo conformidade com esta Política e com a legislação de proteção de dados aplicável.
              </p>

              <p className="mb-4">
                <strong>3.6.</strong> Este aplicativo pode conter links, webviews e iframes para outros sites. Se você clicar em um link de terceiros e/ou acessar o conteúdo desses sites, você será direcionado para esse site e estará sujeito às políticas de privacidade dos mesmos. Esses sites externos não são operados por nós.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.7. Cookies</h3>
              <p className="mb-4">
                Este serviço não utiliza "cookies" de forma explícita; contudo, o app pode usar código de terceiros e bibliotecas que empregam "cookies"/SDKs para coletar informações e melhorar serviços. Você pode aceitar/recusar cookies e ser informado quando um cookie for enviado ao seu dispositivo. Ao recusar, algumas partes do serviço podem não funcionar.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.7-A. Cookies & SDKs – consentimento e preferências</h3>
              <p className="mb-4">
                Disponibilizaremos painel de preferências para que o Usuário gerencie consentimentos a cookies/SDKs não essenciais (analíticos e publicidade). O Usuário poderá revogar consentimentos a qualquer tempo no painel. Informaremos finalidade, vida útil e terceiros envolvidos.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.7-B. Retenção e descarte</h3>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-black">Categoria de dado</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-black">Exemplo</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-black">Retenção típica</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-black">Base de retenção</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-black">Descarte</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Cadastro/conta</td>
                      <td className="border border-gray-300 px-3 py-2">Nome, e-mail, telefone</td>
                      <td className="border border-gray-300 px-3 py-2">Enquanto durar a conta + prazos legais</td>
                      <td className="border border-gray-300 px-3 py-2">Execução de contrato/legítimo interesse/obrigação legal</td>
                      <td className="border border-gray-300 px-3 py-2">Exclusão/anonimização após encerramento e prazos</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Logs de acesso à aplicação</td>
                      <td className="border border-gray-300 px-3 py-2">IP, data/hora</td>
                      <td className="border border-gray-300 px-3 py-2">6 meses</td>
                      <td className="border border-gray-300 px-3 py-2">Marco Civil da Internet</td>
                      <td className="border border-gray-300 px-3 py-2">Descarte seguro</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-3 py-2">Faturamento/Notas fiscais (quando aplicável à Plataforma)</td>
                      <td className="border border-gray-300 px-3 py-2">Dados fiscais</td>
                      <td className="border border-gray-300 px-3 py-2">5 anos (ou prazo legal aplicável)</td>
                      <td className="border border-gray-300 px-3 py-2">Obrigação legal/fiscal</td>
                      <td className="border border-gray-300 px-3 py-2">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.8. Segurança</h3>
              <p className="mb-4">
                Todas as informações coletadas trafegam de forma segura, com criptografia padrão da Internet (TLS/SSL). O armazenamento de dados é realizado em infraestrutura segura provida pela Supabase, com criptografia em repouso. Nenhum método de transmissão/armazenamento é 100% seguro; informaremos incidentes relevantes o mais rápido possível.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.8.1. Medidas adicionais</h3>
              <p className="mb-4">
                Adotamos, quando aplicável: criptografia em trânsito (TLS) e em repouso, controle de acesso por meio de Row Level Security (RLS) no banco de dados, autenticação segura via Supabase Auth, privilégios mínimos de acesso, registro de eventos, testes/gestão de vulnerabilidades e plano de resposta a incidentes.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.8.2. Incidentes</h3>
              <p className="mb-4">
                Quando exigido pela legislação, notificaremos titulares e ANPD acerca de incidentes que possam acarretar risco ou dano relevante, indicando dados afetados, medidas de segurança e providências adotadas.
              </p>

              <h3 className="text-lg font-medium text-black mt-6 mb-3">3.9. Menores e supervisão</h3>
              <p className="mb-4">
                É vetado o uso por menores de idade (ver Termos). A avaliação sobre atendimento remoto/presencial e o tratamento de dados assistenciais cabem ao Profissional, conforme normas aplicáveis.
              </p>
            </section>

            {/* 4. Encarregado */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">4. Do setor Encarregado de Proteção de Dados (Data Protection Officer)</h2>

              <p className="mb-4">
                <strong>4.1.</strong> O Encarregado de Proteção de Dados (Data Protection Officer) é a Pessoa/setor indicado por Nós para atuar como canal de comunicação entre Nós, os titulares dos dados e a Autoridade Nacional de Proteção de Dados (ANPD).
              </p>

              <p className="mb-4">
                <strong>4.2.</strong> Nesta plataforma o setor Encarregado de Proteção de Dados (Data Protection Officer) poderá ser contactado pelo e-mail: <strong>juridico@fanaticamente.com</strong>.
              </p>

              <p className="mb-4">
                <strong>4.2.1. Atendimento.</strong> De segunda a sexta, dias úteis, das 9h às 18h (BRT). Esforçamo-nos para responder em até 30 dias às solicitações de titulares.
              </p>
            </section>

            {/* 5. Alterações */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">5. Das Alterações</h2>

              <p className="mb-4">
                <strong>5.1.</strong> O Usuário está ciente que Nós poderemos alterar o teor desta Política a qualquer momento, em caso de atualização das finalidades ou necessidades do tratamento, em especial para adequação e atendimento à disposição de lei ou norma que tenha força jurídica equivalente. Nesse sentido, sempre que o Usuário acessar Nossos Ambientes ou utilizar nossos serviços, deverá verificar o teor da Política de Privacidade vigente à época.
              </p>

              <p className="mb-4">
                <strong>5.2. Vigência e "o que mudou".</strong> Indicaremos a data de vigência desta Política e, quando cabível, apresentaremos um resumo das principais alterações ("changelog"). Quando a alteração envolver novas finalidades que dependam de consentimento, solicitaremos novo consentimento.
              </p>
            </section>

            {/* 6. Marco Civil */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">6. Marco Civil – Registros e Remoção de Conteúdo</h2>

              <p className="mb-4">
                <strong>6.1.</strong> Registros de acesso à aplicação poderão ser mantidos por 6 (seis) meses, nos termos legais.
              </p>

              <p className="mb-4">
                <strong>6.2.</strong> Poderemos remover ou indisponibilizar conteúdos que violem esta Política, nossos Termos ou a legislação, preservando registros e cooperando com autoridades quando necessário.
              </p>
            </section>

            {/* 7. Foro */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">7. Do direito aplicável e do foro</h2>

              <p className="mb-4">
                <strong>7.1.</strong> Essa Política será interpretada segundo a legislação brasileira, no idioma português, sendo eleito o foro da Comarca de Florianópolis/SC para dirimir qualquer controvérsia que envolva este documento, salvo ressalva específica de competência pessoal, territorial ou funcional pela legislação aplicável, inclusive o direito do consumidor de ajuizar ação em seu domicílio.
              </p>
            </section>

            {/* 8. Aceite */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">8. Aceite de versões atualizadas</h2>

              <p className="mb-4">
                <strong>8.1.</strong> Ao continuar a acessar ou utilizar os serviços do aplicativo após a data de entrada em vigor da nova política, você aceita e concorda em estar vinculado à versão revisada da mesma.
              </p>
            </section>

  </div>
);

const PrivacyPolicy = () => (
  <LegalDocumentView
    slug="privacy-policy"
    title="Política de Privacidade"
    fallback={<PrivacyPolicyFallback />}
    fallbackDate="17 de março de 2026"
  />
);

export default PrivacyPolicy;