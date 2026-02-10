import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface BookingTermsDialogProps {
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
  clubColor?: string;
}

const BookingTermsDialog = ({ accepted, onAcceptChange, clubColor = "#10b981" }: BookingTermsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border" style={{ borderColor: clubColor + "30" }}>
      <label 
        htmlFor="booking-terms" 
        className="flex items-start gap-3 cursor-pointer"
      >
        <Checkbox
          id="booking-terms"
          checked={accepted}
          onCheckedChange={(checked) => onAcceptChange(checked === true)}
          className="mt-0.5 border-2 flex-shrink-0 h-5 w-5 data-[state=checked]:text-white"
          style={{ 
            borderColor: accepted ? clubColor : clubColor + "60",
            backgroundColor: accepted ? clubColor : undefined 
          }}
        />
        <p className="text-sm leading-relaxed" style={{ color: clubColor }}>
          Li e aceito os{" "}
          <Dialog open={open} onOpenChange={setOpen}>
            <a
              href="#"
              className="font-bold underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-normal break-words"
              style={{ color: clubColor }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
              }}
            >
              Termos e Política de Agendamento
            </a>
            <DialogContent 
              className="max-w-lg max-h-[85vh]"
              style={{ 
                backgroundColor: clubColor,
                borderColor: clubColor 
              }}
            >
              <DialogHeader>
                <DialogTitle className="text-xl text-white/90 font-bold text-center">
                  Termos e Política de Agendamento
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="text-white/85 space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Sobre a Plataforma</h3>
                    <p>
                      A Fanaticamente é uma plataforma que conecta você a psicólogos(as) que atuam de forma independente. Somos um serviço de tecnologia e suporte, não um serviço de psicologia.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Os Profissionais</h3>
                    <p>
                      Cada profissional atua com total autonomia. Não existe vínculo empregatício com a Fanaticamente. Eles utilizam nossa plataforma como ferramenta de divulgação e gestão de agenda.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Sobre os Pagamentos</h3>
                    <p className="mb-2">
                      <strong className="text-white">Importante:</strong> Os valores pagos vão diretamente para o(a) profissional escolhido(a). A Fanaticamente não recebe, processa ou retém nenhum valor das sessões.
                    </p>
                    <p>
                      O QR Code ou link de pagamento é gerado usando exclusivamente a chave PIX do(a) profissional. Todo o valor é transferido diretamente a ele(a).
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Nossa Função</h3>
                    <p>
                      Oferecemos um ambiente para que profissionais anunciem serviços, usuários encontrem profissionais e agendamentos sejam organizados. Facilitamos a conexão, mas não interferimos na atuação profissional.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Suas Responsabilidades</h3>
                    <p>
                      A escolha do(a) profissional é sua responsabilidade. Verifique credenciais e qualificações. Questões sobre o atendimento devem ser tratadas diretamente com o profissional.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2">Cancelamentos</h3>
                    <p className="mb-2">
                      Em caso de impossibilidade de comparecer à sessão no dia e horário agendado, os usuários poderão reagendar uma nova data e horário em seu painel de agendamentos. Em caso de cancelamentos, no mesmo painel o usuário ou o profissional poderão solicitar o mesmo, ficando a cargo dos profissionais a responsabilidade de reembolso ao usuário caso existir.
                    </p>
                    <p>
                      Como os pagamentos são realizados diretamente aos profissionais, políticas de cancelamento e reembolso são definidas por cada um. Trate essas questões diretamente com o(a) profissional escolhido(a).
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/20">
                    <p className="text-white/70 text-xs">
                      Ao aceitar, você confirma que leu e compreendeu estas informações.
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <div className="pt-4 border-t border-white/20">
                <Button 
                  onClick={() => setOpen(false)} 
                  className="w-full bg-white hover:bg-white/90 font-semibold"
                  style={{ color: clubColor }}
                >
                  Entendi
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          . Declaro estar ciente de que os pagamentos são realizados diretamente ao profissional e que a Fanaticamente atua apenas como uma plataforma de conexão.
        </p>
      </label>
    </div>
  );
};

export default BookingTermsDialog;
