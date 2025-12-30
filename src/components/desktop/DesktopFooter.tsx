import { Link } from "react-router-dom";
import logoHeader from "@/assets/logo-header.png";

const footerLinks = {
  "Serviços": [
    { label: "Psicólogos", path: "/terapeutas" },
    { label: "FanatiClass", path: "/cursos" },
    { label: "Comunidade", path: "/quiz" },
    { label: "Rádio", path: "/radio" },
  ],
  "Empresa": [
    { label: "Sobre nós", path: "#" },
    { label: "Carreiras", path: "#" },
    { label: "Imprensa", path: "#" },
    { label: "Contato", path: "#" },
  ],
  "Legal": [
    { label: "Privacidade", path: "#" },
    { label: "Termos de uso", path: "#" },
    { label: "Cookies", path: "#" },
  ],
};

const DesktopFooter = () => {
  return (
    <footer className="bg-[hsl(220,14%,10%)] text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logoHeader} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-2xl tracking-wide">Fanática</span>
            </Link>
            <p className="text-white/60 max-w-sm mb-6">
              Cuidando da saúde mental de torcedores apaixonados em todo o Brasil.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                📱
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                📷
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                💼
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.path}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            © 2025 Fanática. Todos os direitos reservados.
          </p>
          <p className="text-white/40 text-sm">
            Feito com ❤️ para torcedores de todo o Brasil
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;
