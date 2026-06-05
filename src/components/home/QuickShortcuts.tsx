import { Link } from "react-router-dom";
import { Calendar, GraduationCap } from "lucide-react";

type ShortcutProps = {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

const ShortcutCard = ({ to, icon, title, subtitle }: ShortcutProps) => (
  <Link
    to={to}
    className="relative rounded-2xl p-[1px] bg-gradient-to-b from-emerald-500/60 via-emerald-500/10 to-emerald-500/40 active:scale-[0.98] transition-transform"
  >
    <div className="relative overflow-hidden rounded-2xl bg-[#0e0e0e] px-4 py-5 flex items-center gap-3">
      {/* top glow */}
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_2px_rgba(16,185,129,0.7)]" />
      {/* bottom glow */}
      <span className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_2px_rgba(16,185,129,0.6)]" />
      {icon}
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-white text-[15px] font-bold tracking-tight truncate">{title}</span>
        <span className="text-neutral-400 text-[11px] truncate">{subtitle}</span>
      </div>
    </div>
  </Link>
);

const QuickShortcuts = () => {
  return (
    <div className="px-4 py-4 grid grid-cols-2 gap-3">
      <ShortcutCard
        to="/meus-agendamentos"
        icon={<Calendar className="w-9 h-9 text-emerald-500 shrink-0" strokeWidth={2} />}
        title="Minhas Consultas"
        subtitle="Gerencie seus atendimentos"
      />
      <ShortcutCard
        to="/meus-cursos"
        icon={<GraduationCap className="w-9 h-9 text-emerald-500 shrink-0" strokeWidth={2} />}
        title="Meus Cursos"
        subtitle="Continue sua jornada"
      />
    </div>
  );
};

export default QuickShortcuts;