import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Terapeutas from "./pages/Terapeutas";
import Cursos from "./pages/Cursos";
import CursoDetalhe from "./pages/CursoDetalhe";
import Quiz from "./pages/Quiz";
import Diario from "./pages/Diario";
import Radio from "./pages/Radio";
import Futebol from "./pages/Futebol";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccess from "./pages/AdminAccess";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import SetupTestUsers from "./pages/SetupTestUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/terapeutas" element={<Terapeutas />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/curso/:id" element={<CursoDetalhe />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/diario" element={<Diario />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/futebol" element={<Futebol />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/profissional" element={<ProfessionalDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/desenvolvedor" element={<DeveloperDashboard />} />
            <Route path="/admin-access" element={<AdminAccess />} />
            <Route path="/setup-test" element={<SetupTestUsers />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
