import { Link } from "react-router-dom";
import { CalendarDays, GraduationCap } from "lucide-react";

type ShortcutProps = {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const ShortcutCard = ({ to, icon, title, subtitle }: ShortcutProps) => (
  <Link
    to={to}
    className="group relative block rounded-2xl p-[1.5px] bg-gradient-to-b from-emerald-400/70 via-emerald-500/20 to-emerald-600/50 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.45)] active:scale-[0.98] transition-transform"
  >
    <div
      className="relative overflow-hidden rounded-[14px] px-3 py-4 flex items-center gap-2.5"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(16,185,129,0.12) 0%, rgba(14,14,14,0) 55%), linear-gradient(180deg, #111 0%, #0b0b0b 100%)",
      }}
    >
      {/* top neon highlight */}
      <span className="pointer-events-none absolute inset-x-8 top-[1px] h-[2px] rounded-full bg-emerald-400 blur-[1.5px] opacity-90" />
      <span className="pointer-events-none absolute inset-x-12 top-0 h-[6px] bg-emerald-400/40 blur-md" />
      {/* bottom subtle glow */}
      <span className="pointer-events-none absolute inset-x-16 bottom-[1px] h-[1.5px] rounded-full bg-emerald-400/80 blur-[1px]" />
      {icon}
      <div className="relative flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-white text-[13px] font-extrabold tracking-tight whitespace-nowrap">{title}</span>
        <span className="text-neutral-400 text-[10px] whitespace-nowrap">{subtitle}</span>
      </div>
    </div>
  </Link>
);

const QuickShortcuts = () => {
  return (
    <div className="px-4 py-4 grid grid-cols-2 gap-3">
      <ShortcutCard
        to="/meus-agendamentos"
        icon={<CalendarDays className="w-8 h-8 text-emerald-500 shrink-0" strokeWidth={2} />}
        title="Minhas Consultas"
        subtitle="Gerencie atendimentos"
      />
      <ShortcutCard
        to="/meus-cursos"
        icon={<GraduationCap className="w-8 h-8 text-emerald-500 shrink-0" strokeWidth={2} />}
        title="Meus Cursos"
        subtitle="Continue sua jornada"
      />
    </div>
  );
};

export default QuickShortcuts;