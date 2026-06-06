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
    className="relative flex flex-col items-center justify-center gap-2 px-3 transition-all duration-200 active:scale-[0.98]"
    style={{
      minHeight: 118,
      borderRadius: 24,
      background: "#111111",
      border: "1px solid rgba(0,255,100,0.25)",
      boxShadow: "0 0 12px rgba(0,255,100,0.08)",
    }}
  >
    {icon}
    <div className="flex flex-col items-center leading-tight min-w-0">
      <span className="text-white text-[15px] font-bold tracking-tight whitespace-nowrap">{title}</span>
      <span className="text-neutral-400 text-[11px] mt-0.5 whitespace-nowrap">{subtitle}</span>
    </div>
  </Link>
);

const QuickShortcuts = () => {
  return (
    <div className="px-4 py-4 grid grid-cols-2 gap-3">
      <ShortcutCard
        to="/meus-agendamentos"
        icon={<CalendarDays className="text-emerald-500 shrink-0" size={32} strokeWidth={2} />}
        title="Minhas Consultas"
        subtitle="Gerencie atendimentos"
      />
      <ShortcutCard
        to="/meus-cursos"
        icon={<GraduationCap className="text-emerald-500 shrink-0" size={32} strokeWidth={2} />}
        title="Meus Cursos"
        subtitle="Continue sua jornada"
      />
    </div>
  );
};

export default QuickShortcuts;