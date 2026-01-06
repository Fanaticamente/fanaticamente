import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useRouteRestoration } from "@/hooks/useRouteRestoration";
import Index from "./pages/Index";
import Terapeutas from "./pages/Terapeutas";
import ProfessionalProfile from "./pages/ProfessionalProfile";
import SessionPayment from "./pages/SessionPayment";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Cursos from "./pages/Cursos";
import CursoDetalhe from "./pages/CursoDetalhe";
import Quiz from "./pages/Quiz";
import Diario from "./pages/Diario";
import Radio from "./pages/Radio";
import Futebol from "./pages/Futebol";
import Perfil from "./pages/Perfil";
import MeusAgendamentos from "./pages/MeusAgendamentos";
import FanaticaShop from "./pages/FanaticaShop";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccess from "./pages/AdminAccess";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import SetupTestUsers from "./pages/SetupTestUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component that handles realtime subscriptions and route restoration
const AppProviders = ({ children }: { children: React.ReactNode }) => {
  useRealtimeSubscriptions();
  useRouteRestoration();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppProviders>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-access" element={<AdminAccess />} />
              <Route path="/setup-test" element={<SetupTestUsers />} />

              {/* Protected routes - require login */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/terapeutas" element={<ProtectedRoute><Terapeutas /></ProtectedRoute>} />
              <Route path="/terapeuta/:id" element={<ProtectedRoute><ProfessionalProfile /></ProtectedRoute>} />
              <Route path="/pagamento/:id" element={<ProtectedRoute><SessionPayment /></ProtectedRoute>} />
              <Route path="/pagamento/confirmacao/:id" element={<ProtectedRoute><PaymentConfirmation /></ProtectedRoute>} />
              <Route path="/cursos" element={<ProtectedRoute><Cursos /></ProtectedRoute>} />
              <Route path="/curso/:id" element={<ProtectedRoute><CursoDetalhe /></ProtectedRoute>} />
              <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
              <Route path="/diario" element={<ProtectedRoute><Diario /></ProtectedRoute>} />
              <Route path="/radio" element={<ProtectedRoute><Radio /></ProtectedRoute>} />
              <Route path="/futebol" element={<ProtectedRoute><Futebol /></ProtectedRoute>} />
              <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
              <Route path="/perfil/agendamentos" element={<ProtectedRoute><MeusAgendamentos /></ProtectedRoute>} />
              <Route path="/loja" element={<ProtectedRoute><FanaticaShop /></ProtectedRoute>} />
              <Route path="/loja/produto/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
              <Route path="/profissional" element={<ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/desenvolvedor" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppProviders>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
