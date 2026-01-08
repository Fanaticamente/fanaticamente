import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/20 text-primary-foreground hover:bg-white/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-primary-foreground font-bold text-lg">Política de Privacidade</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-64px)]">
        <main className="p-6 pb-24 max-w-4xl mx-auto">
          <div className="prose prose-sm max-w-none text-foreground">
            <h1 className="text-2xl font-bold text-primary mb-6">
              POLÍTICA DE PRIVACIDADE E TRATAMENTO DE DADOS
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Última atualização: Janeiro de 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">1. IDENTIFICAÇÃO DO CONTROLADOR</h2>
              <p className="mb-4">
                <strong>Fanaticamente Tecnologia e Serviços LTDA</strong><br />
                CNPJ: 59.281.253/0001-30<br />
                Endereço: Rua Exemplo, 123 - São Paulo/SP<br />
                E-mail para contato: privacidade@fanaticamente.com.br
              </p>
              <p>
                A Fanaticamente é a controladora dos dados pessoais coletados através deste aplicativo, 
                nos termos da Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">2. PAPEL DOS PROFISSIONAIS</h2>
              <p className="mb-4">
                Os profissionais que utilizam a plataforma para ofertar seus serviços são 
                <strong> controladores independentes</strong> dos dados pessoais de seus pacientes/clientes. 
                A Fanaticamente atua como operadora desses dados quando os processa em nome dos profissionais.
              </p>
              <p>
                Cada profissional é responsável por:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Obter consentimento apropriado de seus pacientes</li>
                <li>Cumprir as obrigações éticas de sua categoria profissional</li>
                <li>Garantir o sigilo das informações de seus atendimentos</li>
                <li>Responder por suas próprias práticas de tratamento de dados</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">3. DADOS PESSOAIS COLETADOS</h2>
              <p className="mb-4">Coletamos os seguintes dados pessoais:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">3.1. Dados de Cadastro</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone com DDD</li>
                <li>Data de nascimento</li>
                <li>Estado e cidade de residência</li>
                <li>Clube de futebol favorito (preferência)</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">3.2. Dados de Profissionais</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>CPF ou CNPJ</li>
                <li>Registro profissional (CRP)</li>
                <li>Documentos comprobatórios de habilitação</li>
                <li>Dados bancários/PIX para recebimento</li>
                <li>Especialidades e experiência profissional</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">3.3. Dados de Uso</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Histórico de agendamentos</li>
                <li>Avaliações e feedbacks</li>
                <li>Logs de acesso e navegação</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">4. FINALIDADES DO TRATAMENTO</h2>
              <p className="mb-4">Utilizamos seus dados para:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Criar e gerenciar sua conta na plataforma</li>
                <li>Possibilitar agendamentos com profissionais</li>
                <li>Facilitar a comunicação entre usuários e profissionais</li>
                <li>Processar pagamentos (quando aplicável)</li>
                <li>Enviar comunicações sobre seus agendamentos</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">5. COMPARTILHAMENTO DE DADOS</h2>
              <p className="mb-4">Seus dados podem ser compartilhados com:</p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">5.1. Provedores de Infraestrutura</h3>
              <p>
                <strong>Supabase</strong> - Utilizado para armazenamento de dados e autenticação de usuários. 
                A Supabase mantém seus servidores com padrões de segurança de nível empresarial e 
                cumpre regulamentações internacionais de proteção de dados.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">5.2. Processadores de Pagamento</h3>
              <p className="mb-2">
                <strong>Stripe</strong> - Para processamento de pagamentos via cartão de crédito. 
                O Stripe é certificado como PCI Level 1, o mais alto nível de certificação do setor de pagamentos.
              </p>
              <p>
                <strong>Sistema PIX</strong> - Os pagamentos via PIX são direcionados diretamente 
                para a chave cadastrada pelo profissional, sem intermediação da Fanaticamente.
              </p>

              <h3 className="text-lg font-medium mt-4 mb-2">5.3. Profissionais</h3>
              <p>
                Ao agendar uma sessão, suas informações básicas (nome e dados de contato) 
                são compartilhadas com o profissional escolhido para viabilizar o atendimento.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">6. ARMAZENAMENTO E SEGURANÇA</h2>
              <p className="mb-4">
                Seus dados são armazenados em servidores seguros da Supabase, com:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Criptografia em trânsito (TLS/SSL)</li>
                <li>Criptografia em repouso</li>
                <li>Controles de acesso baseados em função (RLS)</li>
                <li>Backup regular dos dados</li>
                <li>Monitoramento contínuo de segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">7. SEUS DIREITOS</h2>
              <p className="mb-4">
                De acordo com a LGPD, você tem direito a:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Confirmar a existência de tratamento de seus dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos ou desatualizados</li>
                <li>Solicitar anonimização ou eliminação de dados desnecessários</li>
                <li>Solicitar portabilidade dos dados</li>
                <li>Revogar consentimento a qualquer momento</li>
                <li>Solicitar exclusão de sua conta</li>
              </ul>
              <p className="mt-4">
                Para exercer seus direitos, acesse as configurações de sua conta ou entre em contato 
                através do e-mail: <strong>privacidade@fanaticamente.com.br</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">8. RETENÇÃO DE DADOS</h2>
              <p>
                Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades 
                descritas nesta política, ou conforme exigido por lei. Após a exclusão de sua conta, 
                alguns dados podem ser retidos por períodos adicionais para cumprimento de 
                obrigações legais, fiscais ou para exercício de direitos em processos judiciais.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">9. MENORES DE IDADE</h2>
              <p>
                Este aplicativo não é destinado a menores de 18 anos. Não coletamos 
                intencionalmente dados de menores. Caso identifiquemos tal coleta, 
                os dados serão excluídos imediatamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">10. ALTERAÇÕES NESTA POLÍTICA</h2>
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos sobre 
                alterações significativas através do aplicativo ou por e-mail. 
                Recomendamos revisar esta política regularmente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">11. CONTATO</h2>
              <p>
                Para dúvidas sobre esta política ou sobre o tratamento de seus dados pessoais, 
                entre em contato:
              </p>
              <p className="mt-2">
                <strong>E-mail:</strong> privacidade@fanaticamente.com.br<br />
                <strong>Encarregado de Dados (DPO):</strong> dpo@fanaticamente.com.br
              </p>
            </section>
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicy;
