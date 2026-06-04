import { Link } from "react-router-dom";
import { Calendar, GraduationCap } from "lucide-react";

const QuickShortcuts = () => {
  return (
    <div className="px-4 py-4 grid grid-cols-2 gap-3">
      <Link
        to="/meus-agendamentos"
        className="flex flex-col items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl py-5 active:scale-95 transition-transform"
      >
        <Calendar className="w-7 h-7 text-emerald-500" strokeWidth={2} />
        <span className="text-white text-sm font-semibold">Minhas Consultas</span>
      </Link>
      <Link
        to="/cursos"
        className="flex flex-col items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl py-5 active:scale-95 transition-transform"
      >
        <GraduationCap className="w-7 h-7 text-emerald-500" strokeWidth={2} />
        <span className="text-white text-sm font-semibold">Meus Cursos</span>
      </Link>
    </div>
  );
};

export default QuickShortcuts;