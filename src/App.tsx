import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useRouteRestoration } from "@/hooks/useRouteRestoration";
import { useGlobalSessionCompletion } from "@/hooks/useGlobalSessionCompletion";
import SessionCompletedDialog from "@/components/user/SessionCompletedDialog";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import FanaticaLab from "./pages/FanaticaLab";
import ClinicalNotes from "./pages/fanatica-lab/ClinicalNotes";
import ObservationMap from "./pages/fanatica-lab/ObservationMap";
import TherapeuticPlan from "./pages/fanatica-lab/TherapeuticPlan";
import CaseReview from "./pages/fanatica-lab/CaseReview";
import ReferenceLibrary from "./pages/fanatica-lab/ReferenceLibrary";
import PsiHouse from "./pages/PsiHouse";
import Conecta from "./pages/Conecta";
import OSMF from "./pages/OSMF";

const queryClient = new QueryClient();

const isEmbedMode = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("embed") === "1";
  } catch {
    return false;
  }
};

// Component that handles realtime subscriptions, route restoration, and global session completion
const AppProviders = ({ children }: { children: React.ReactNode }) => {
  useRealtimeSubscriptions();
  useRouteRestoration();
  const { completedAppointment, clearCompletedAppointment } = useGlobalSessionCompletion();

  return (
    <>
      {children}
      {/* Global Session Completion Dialog - shows on any page */}
      {completedAppointment && (
        <SessionCompletedDialog
          appointment={completedAppointment}
          onClose={clearCompletedAppointment}
          onRatingSubmitted={() => {
            // Don't close immediately - let user see reschedule/close options
            // The dialog will handle showing those options after rating
          }}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/*
        Embed mode: used by the Developer "preview" iframe.
        We intentionally avoid mounting AuthProvider/ProtectedRoute and other global side-effects
        to prevent cross-tab auth broadcasts and route-restoration loops.
      */}
      {isEmbedMode() ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/terapeutas" element={<Terapeutas />} />
            <Route path="/terapeuta/:id" element={<ProfessionalProfile />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/curso/:id" element={<CursoDetalhe />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/futebol" element={<Futebol />} />
            <Route path="/loja" element={<FanaticaShop />} />
            <Route path="/loja/produto/:id" element={<ProductDetail />} />
            <Route path="/osmf" element={<OSMF />} />
            <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      ) : (
        <AuthProvider>
          <BrowserRouter>
            <AppProviders>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes - accessible without login */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin-access" element={<AdminAccess />} />
                <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
                <Route path="/setup-test" element={<SetupTestUsers />} />
                
                {/* Public content routes - viewable without login (desktop navigation) */}
                <Route path="/" element={<Index />} />
                <Route path="/terapeutas" element={<Terapeutas />} />
                <Route path="/terapeuta/:id" element={<ProfessionalProfile />} />
                <Route path="/cursos" element={<Cursos />} />
                <Route path="/curso/:id" element={<CursoDetalhe />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/radio" element={<Radio />} />
                <Route path="/futebol" element={<Futebol />} />
                <Route path="/loja" element={<FanaticaShop />} />
                <Route path="/loja/produto/:id" element={<ProductDetail />} />
                <Route path="/osmf" element={<OSMF />} />

                {/* Protected routes - require login */}
                <Route path="/pagamento/:id" element={<ProtectedRoute><SessionPayment /></ProtectedRoute>} />
                <Route path="/pagamento/confirmacao/:id" element={<ProtectedRoute><PaymentConfirmation /></ProtectedRoute>} />
                <Route path="/diario" element={<ProtectedRoute><Diario /></ProtectedRoute>} />
                <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                <Route path="/perfil/agendamentos" element={<ProtectedRoute><MeusAgendamentos /></ProtectedRoute>} />
                <Route path="/loja/produto/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                <Route path="/profissional" element={<ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>} />
                <Route path="/fanatica-lab" element={<ProtectedRoute><FanaticaLab /></ProtectedRoute>} />
                <Route path="/fanatica-lab/notas-clinicas" element={<ProtectedRoute><ClinicalNotes /></ProtectedRoute>} />
                <Route path="/fanatica-lab/mapa-observacao" element={<ProtectedRoute><ObservationMap /></ProtectedRoute>} />
                <Route path="/fanatica-lab/plano-terapeutico" element={<ProtectedRoute><TherapeuticPlan /></ProtectedRoute>} />
                <Route path="/fanatica-lab/revisao-caso" element={<ProtectedRoute><CaseReview /></ProtectedRoute>} />
                <Route path="/fanatica-lab/biblioteca" element={<ProtectedRoute><ReferenceLibrary /></ProtectedRoute>} />
                <Route path="/psi-house" element={<ProtectedRoute><PsiHouse /></ProtectedRoute>} />
                <Route path="/conecta" element={<ProtectedRoute><Conecta /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/desenvolvedor" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProviders>
          </BrowserRouter>
        </AuthProvider>
      )}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
