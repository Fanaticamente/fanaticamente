import { useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FlaskConical, 
  FileText, 
  Map, 
  Target, 
  RefreshCw, 
  BookOpen,
  ChevronRight,
  Shield
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const modules = [
  {
    id: "clinical-notes",
    title: "Notas Clínicas Pessoais",
    description: "Registre observações pessoais após as sessões",
    icon: FileText,
    path: "/fanatica-lab/notas-clinicas",
    color: "bg-blue-500"
  },
  {
    id: "observation-map",
    title: "Mapa de Observação Clínica",
    description: "Estrutura guiada com campos reflexivos",
    icon: Map,
    path: "/fanatica-lab/mapa-observacao",
    color: "bg-purple-500"
  },
  {
    id: "therapeutic-plan",
    title: "Plano Terapêutico Pessoal",
    description: "Defina objetivos e estratégias terapêuticas",
    icon: Target,
    path: "/fanatica-lab/plano-terapeutico",
    color: "bg-primary"
  },
  {
    id: "case-review",
    title: "Revisão de Caso",
    description: "Auto-supervisão com perguntas orientadoras",
    icon: RefreshCw,
    path: "/fanatica-lab/revisao-caso",
    color: "bg-orange-500"
  },
  {
    id: "reference-library",
    title: "Biblioteca de Referências",
    description: "Salve links, textos e ideias clínicas",
    icon: BookOpen,
    path: "/fanatica-lab/biblioteca",
    color: "bg-rose-500"
  }
];

const FanaticaLab = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Force light theme for professional environment
  useLayoutEffect(() => {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light', 'professional-theme');
    document.documentElement.style.colorScheme = 'light';
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#1a1a1a';
    
    return () => {
      document.documentElement.classList.remove('professional-theme');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  const modulesContent = (
    <>
      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20 mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                O FanaticaLab é um espaço privado de apoio ao raciocínio clínico, 
                organização profissional e reflexão do psicólogo. Todo conteúdo é de 
                uso exclusivo seu e não é compartilhado com pacientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Módulos</h2>
      <div className={`${isMobile ? "space-y-3" : "grid grid-cols-2 gap-4"}`}>
        {modules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={module.id}
              className="bg-white border-gray-200 hover:border-primary/30 transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => navigate(module.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 ${module.color} rounded-xl flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{module.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ethical Notice */}
      <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl">
        <p className="text-xs text-primary text-center">
          ⚠️ Este espaço não substitui prontuário clínico. Não realiza diagnósticos 
          ou atendimento psicológico. Uso pessoal e sigiloso.
        </p>
      </div>
    </>
  );

  // Desktop Layout
  if (!isMobile) {
    return (
      <ProfessionalDesktopLayout title="FanaticaLab" subtitle="Espaço privado de reflexão">
        {modulesContent}
      </ProfessionalDesktopLayout>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FanaticaLab</h1>
            <p className="text-sm text-gray-500">Espaço privado de reflexão</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-32">
        {modulesContent}
      </div>

      <ProfessionalBottomNav />
    </div>
  );
};

export default FanaticaLab;
