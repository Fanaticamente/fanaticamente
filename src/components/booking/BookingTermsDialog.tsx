import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle } from "lucide-react";

interface BookingTermsDialogProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
  clubColor?: string;
}

const BookingTermsDialog = ({ accepted, onAcceptChange, clubColor = "hsl(var(--primary))" }: BookingTermsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
      <div className="flex items-start gap-3 mb-4">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: clubColor + "15" }}
        >
          <FileText className="w-5 h-5" style={{ color: clubColor }} />
        </div>
        <div>
          <h2 className="font-bold text-lg" style={{ color: clubColor }}>
            Termos do Agendamento
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Leia e aceite os termos antes de prosseguir com o pagamento
          </p>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Importante sobre o pagamento:</p>
            <p>
              O valor pago é transferido <strong>diretamente para o profissional</strong>. 
              A Fanaticamente não recebe, processa ou retém qualquer valor das sessões.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Dialog Trigger */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full mb-4 py-3 border-2"
            style={{ borderColor: clubColor + "40" }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Ler Termos Completos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ color: clubColor }}>
              Termos de Uso do Agendamento
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none text-foreground">
              <h3 className="text-lg font-semibold mt-4 mb-3">1. SOBRE A PLATAFORMA</h3>
              <p className="mb-4">
                A <strong>Fanaticamente Tecnologia e Serviços LTDA</strong> ("Fanaticamente") é uma plataforma 
                de marketplace que conecta usuários a profissionais de psicologia que atuam de forma 
                independente e autônoma. <strong>A Fanaticamente NÃO é um serviço de Psicologia</strong>, 
                mas sim uma plataforma de suporte tecnológico.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">2. AUTONOMIA DOS PROFISSIONAIS</h3>
              <p className="mb-4">
                Cada profissional cadastrado na plataforma possui <strong>total autonomia</strong> sobre 
                sua atuação profissional. A Fanaticamente:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <strong>NÃO mantém</strong> qualquer vínculo empregatício com os profissionais
                </li>
                <li>
                  <strong>NÃO intervém</strong> na forma de atuação dos profissionais anunciados
                </li>
                <li>
                  <strong>NÃO é responsável</strong> pelos serviços prestados pelos profissionais
                </li>
                <li>
                  Os profissionais são <strong>contratantes dos serviços</strong> da plataforma, 
                  utilizando-a como ferramenta de divulgação e gestão de agenda
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">3. PAGAMENTOS</h3>
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-4">
                <p className="font-semibold text-destructive mb-2">⚠️ ATENÇÃO - Leia com cuidado:</p>
                <ul className="list-disc pl-6 space-y-2 text-foreground">
                  <li>
                    Os pagamentos realizados através desta plataforma <strong>NÃO passam, em hipótese 
                    alguma, pela empresa Fanaticamente Tecnologia e Serviços</strong>
                  </li>
                  <li>
                    O link ou QR Code de pagamento gerado refere-se <strong>exclusivamente à chave 
                    do profissional escolhido</strong>
                  </li>
                  <li>
                    Todo valor pago pelo usuário é <strong>transferido diretamente para o profissional</strong>
                  </li>
                  <li>
                    <strong>Nenhum valor</strong> relacionado aos agendamentos das sessões transita 
                    pela Fanaticamente
                  </li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-3">4. FUNÇÃO DA FANATICAMENTE</h3>
              <p className="mb-4">
                A Fanaticamente atua exclusivamente como uma <strong>plataforma de marketplace</strong>, 
                disponibilizando um ambiente digital para que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Profissionais anunciem seus serviços</li>
                <li>Usuários encontrem e se conectem com profissionais</li>
                <li>Profissionais gerenciem suas agendas e disponibilidade</li>
                <li>Seja facilitada a comunicação entre as partes</li>
              </ul>
              <p className="mb-4">
                Ainda que a Fanaticamente forneça o sistema, disponibilize as ferramentas de agendamento 
                e administração das agendas dos profissionais, <strong>não há qualquer intervenção</strong> 
                da plataforma na forma de atuação dos profissionais anunciados.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">5. RESPONSABILIDADES DO USUÁRIO</h3>
              <p className="mb-4">Ao utilizar esta plataforma, você reconhece e concorda que:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  A escolha do profissional é de sua <strong>inteira responsabilidade</strong>
                </li>
                <li>
                  Você deve verificar as credenciais e qualificações do profissional
                </li>
                <li>
                  Questões relacionadas ao atendimento devem ser tratadas diretamente com o profissional
                </li>
                <li>
                  A Fanaticamente não se responsabiliza pela qualidade ou resultado dos atendimentos
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">6. CANCELAMENTOS E REEMBOLSOS</h3>
              <p className="mb-4">
                Como os pagamentos são realizados diretamente ao profissional:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  Políticas de cancelamento e reembolso são definidas por cada profissional
                </li>
                <li>
                  Solicitações de reembolso devem ser tratadas diretamente com o profissional
                </li>
                <li>
                  A Fanaticamente não tem poder de decisão sobre reembolsos
                </li>
              </ul>

              <h3 className="text-lg font-semibold mt-6 mb-3">7. DECLARAÇÃO FINAL</h3>
              <p className="mb-4">
                Ao aceitar estes termos, você declara estar ciente de que:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  A Fanaticamente é apenas uma <strong>plataforma de conexão</strong> entre 
                  usuários e profissionais
                </li>
                <li>
                  Os profissionais atuam de forma <strong>independente e autônoma</strong>
                </li>
                <li>
                  Todo pagamento é feito <strong>diretamente ao profissional</strong>, sem 
                  intermediação da Fanaticamente
                </li>
                <li>
                  Você leu, compreendeu e aceita todas as condições aqui descritas
                </li>
              </ul>
            </div>
          </ScrollArea>
          <div className="pt-4 border-t">
            <Button 
              onClick={() => setOpen(false)} 
              className="w-full"
              style={{ backgroundColor: clubColor }}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Acceptance Checkbox */}
      <div className="flex items-start gap-3">
        <Checkbox
          id="booking-terms"
          checked={accepted}
          onCheckedChange={(checked) => onAcceptChange(checked === true)}
          className="mt-1"
          style={{ 
            borderColor: accepted ? clubColor : undefined,
            backgroundColor: accepted ? clubColor : undefined 
          }}
        />
        <label htmlFor="booking-terms" className="text-sm text-foreground cursor-pointer leading-relaxed">
          Li e aceito os <strong>Termos de Uso do Agendamento</strong>. Declaro estar ciente de que 
          os pagamentos são realizados diretamente ao profissional e que a Fanaticamente atua 
          apenas como plataforma de conexão.
        </label>
      </div>
    </div>
  );
};

export default BookingTermsDialog;
