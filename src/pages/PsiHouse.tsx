import { useLayoutEffect } from "react";
import { Building2, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const PsiHouse = () => {
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

  const content = (
    <Card className="bg-white border-gray-200">
      <CardContent className="p-8 text-center">
        <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Em breve</h2>
        <p className="text-gray-500">
          Estamos preparando este espaço especial para você. 
          Aguarde novidades!
        </p>
      </CardContent>
    </Card>
  );

  // Desktop Layout
  if (!isMobile) {
    return (
      <ProfessionalDesktopLayout title="Psi House" subtitle="Espaço do profissional">
        {content}
      </ProfessionalDesktopLayout>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Psi House</h1>
            <p className="text-sm text-gray-500">Espaço do profissional</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-32">
        {content}
      </div>

      <ProfessionalBottomNav />
    </div>
  );
};

export default PsiHouse;
