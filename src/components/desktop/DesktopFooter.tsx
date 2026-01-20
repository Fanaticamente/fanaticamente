import { Link } from "react-router-dom";
import logoHeader from "@/assets/logo-header.png";

const footerLinks = {
  "Serviços": [
    { label: "Psicólogos", path: "/terapeutas" },
    { label: "FanatiClass", path: "/cursos" },
    { label: "Rádio", path: "/radio" },
    { label: "Loja", path: "/loja" },
  ],
  "Empresa": [
    { label: "Sobre nós", path: "#sobre" },
    { label: "Contato", path: "#profissionais" },
  ],
  "Legal": [
    { label: "Privacidade", path: "/privacidade" },
    { label: "Termos de uso", path: "#" },
  ],
};

const DesktopFooter = () => {
  return (
    <footer className="bg-[#050505] text-white py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={logoHeader} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-2xl tracking-wide">Fanaticamente</span>
            </Link>
            <p className="text-gray-500 max-w-sm mb-6">
              Cuidando da saúde mental de torcedores apaixonados em todo o Brasil.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com/fanaticamente" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                📷
              </a>
              <a 
                href="https://www.youtube.com/@fanaticamente" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                ▶️
              </a>
              <a 
                href="https://open.spotify.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                🎧
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-white">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link 
                      to={link.path}
                      className="text-gray-500 hover:text-emerald-400 transition-colors"
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
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © 2025 Fanaticamente. Todos os direitos reservados.
          </p>
          <p className="text-gray-600 text-sm">
            Feito com 💚 para torcedores de todo o Brasil
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DesktopFooter;
