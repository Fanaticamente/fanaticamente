import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Inner-page header: back arrow + search on a white bar. The home page uses
// HomeFloatingActions instead of this component.
const Header = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white flex items-center justify-between px-3 py-2 pt-[calc(env(safe-area-inset-top)+8px)]">
      <button
        aria-label="Voltar"
        onClick={handleBack}
        className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <button
        aria-label="Buscar"
        className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-700"
      >
        <Search className="w-5 h-5" />
      </button>
    </header>
  );
};

export default Header;
