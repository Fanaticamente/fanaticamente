import { Globe } from "lucide-react";
import { Link } from "react-router-dom";

const TicketCard = () => {
  return (
    <div className="mx-4 my-4">
      <div className="card-ticket p-0 overflow-hidden">
        <div className="flex">
          {/* Left side - Main content */}
          <div className="flex-1 p-5 relative">
            <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col items-center justify-center text-ticket-foreground/30 text-[10px] tracking-widest">
              <span className="rotate-[-90deg] whitespace-nowrap">
                Número Ingresso
              </span>
            </div>

            <div className="ml-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="font-display text-lg text-ticket-foreground">
                  fanatica<span className="text-secondary">mente</span>
                </span>
                <span className="flex items-center gap-1 text-sm text-ticket-foreground/70">
                  🏆 Brasileirão da Saúde mental
                </span>
              </div>

              <h3 className="font-display text-2xl text-ticket-foreground mb-4 leading-tight">
                SEU INGRESSO NO MUNDO<br />DA CONSCIÊNCIA
              </h3>

              <div className="flex gap-6 mb-4 text-sm">
                <div>
                  <span className="text-ticket-foreground/60 block">Tempo:</span>
                  <span className="font-bold text-ticket-foreground">60 min</span>
                </div>
                <div>
                  <span className="text-ticket-foreground/60 block">Valor:</span>
                  <span className="font-bold text-secondary">R$ 0,00</span>
                </div>
                <div>
                  <span className="text-ticket-foreground/60 block">ENDEREÇO:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-ticket-foreground">(On-line)</span>
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <Link
                to="/"
                className="inline-block bg-ticket-foreground text-ticket px-6 py-2 rounded font-bold text-sm uppercase tracking-wide hover:bg-secondary hover:text-secondary-foreground transition-colors"
              >
                COMECE POR AQUI
              </Link>
            </div>
          </div>

          {/* Right side - Ticket stub */}
          <div className="w-20 ticket-perforation flex flex-col items-center justify-center gap-2 py-4 bg-ticket/50">
            <div className="text-[10px] text-ticket-foreground/50">
              <span className="block">Cadeira</span>
            </div>
            <span className="font-display text-3xl text-secondary">03</span>

            <div className="text-[10px] text-ticket-foreground/50">
              <span className="block">Fileira</span>
            </div>
            <span className="font-display text-3xl text-secondary">02</span>

            <div className="text-[10px] text-ticket-foreground/50">
              <span className="block">Portão</span>
            </div>
            <span className="font-display text-3xl text-secondary">01</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
