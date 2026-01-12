import { Users, Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";

const Conecta = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conecta</h1>
            <p className="text-sm text-gray-500">Rede de profissionais</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-32">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-8 text-center">
            <Construction className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Em breve</h2>
            <p className="text-gray-500">
              Uma rede de conexão entre profissionais está sendo desenvolvida. 
              Aguarde novidades!
            </p>
          </CardContent>
        </Card>
      </div>

      <ProfessionalBottomNav />
    </div>
  );
};

export default Conecta;
