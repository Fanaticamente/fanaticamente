import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Global safety net: prevent unhandled promise rejections (e.g. video.pause() AbortError)
// from crashing the entire React app with a white screen.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    if (
      reason instanceof DOMException &&
      (reason.name === "AbortError" || reason.name === "NotAllowedError")
    ) {
      event.preventDefault();
      return;
    }
    console.error("[App] Unhandled rejection:", reason);
    event.preventDefault();
  });
}
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RadioProvider } from "@/contexts/RadioContext";
import ProtectedRoute, { DynamicProtectedRoute } from "@/components/ProtectedRoute";
import GlobalRadioPlayer from "@/components/radio/GlobalRadioPlayer";

import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useGlobalSessionCompletion } from "@/hooks/useGlobalSessionCompletion";
import { useDisableServiceWorkerOnManagerRoutes } from "@/hooks/useDisableServiceWorkerOnManagerRoutes";
import { useViewportHeightSync } from "@/hooks/useViewportHeightSync";
import SessionCompletedDialog from "@/components/user/SessionCompletedDialog";
import MobileBrowserBlock from "@/components/MobileBrowserBlock";
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
import Pagamentos from "./pages/Pagamentos";
import Configuracoes from "./pages/Configuracoes";
import FanaticaShop from "./pages/FanaticaShop";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAccess from "./pages/AdminAccess";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import ContentManagers from "./pages/ContentManagers";
import DesktopContentManager from "./pages/DesktopContentManager";
import SetupTestUsers from "./pages/SetupTestUsers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import FanaticaLab from "./pages/FanaticaLab";
import ClinicalNotes from "./pages/fanatica-lab/ClinicalNotes";
import ObservationMap from "./pages/fanatica-lab/ObservationMap";
import TherapeuticPlan from "./pages/fanatica-lab/TherapeuticPlan";
import CaseReview from "./pages/fanatica-lab/CaseReview";
import ReferenceLibrary from "./pages/fanatica-lab/ReferenceLibrary";
import ReceiptTemplate from "./pages/fanatica-lab/ReceiptTemplate";
import PsiHouse from "./pages/PsiHouse";
import Conecta from "./pages/Conecta";
import OSMF from "./pages/OSMF";
import ZonaMista from "./pages/ZonaMista";
import Ranking from "./pages/Ranking";
import Notificacoes from "./pages/Notificacoes";
import VerificarRecibo from "./pages/VerificarRecibo";
import NotificationManagerPage from "./pages/NotificationManagerPage";
import FanaticazeTV from "./pages/FanaticazeTV";
import SetorSaude from "./pages/SetorSaude";
import MarketingDashboard from "./pages/MarketingDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

const isEmbedMode = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("embed") === "1";
  } catch {
    return false;
  }
};

const AppProviders = ({ children }: { children: React.ReactNode }) => {
  useDisableServiceWorkerOnManagerRoutes();
  useRealtimeSubscriptions();
  const { completedAppointment, clearCompletedAppointment } = useGlobalSessionCompletion();

  return (
    <>
      {children}
      {completedAppointment && (
        <SessionCompletedDialog
          appointment={completedAppointment}
          onClose={clearCompletedAppointment}
          onRatingSubmitted={() => {}}
        />
      )}
    </>
  );
};

const App = () => {
  useViewportHeightSync();

  return (
  <QueryClientProvider client={queryClient}>
    <MobileBrowserBlock>
    <TooltipProvider>
      {isEmbedMode() ? (
        <AuthProvider>
          <RadioProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <GlobalRadioPlayer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/terapeutas" element={<Terapeutas />} />
              <Route path="/terapeuta/:id" element={<ProfessionalProfile />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/curso/:id" element={<CursoDetalhe />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/futebol" element={<Futebol />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/loja" element={<FanaticaShop />} />
              <Route path="/loja/produto/:id" element={<ProductDetail />} />
              <Route path="/osmf" element={<OSMF />} />
              <Route path="/zona-mista" element={<ZonaMista />} />
              <Route path="/setor-saude" element={<SetorSaude />} />
              <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/verificar-recibo/:numero" element={<VerificarRecibo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </RadioProvider>
        </AuthProvider>
      ) : (
        <AuthProvider>
          <RadioProvider>
          <BrowserRouter>
            <AppProviders>
              <Toaster />
              <Sonner />
              <GlobalRadioPlayer />
              <Routes>
                {/* Always public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/profissional/auth" element={<Auth />} />
                <Route path="/admin-access" element={<AdminAccess />} />
                <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/setup-test" element={<SetupTestUsers />} />
                <Route path="/verificar-recibo/:numero" element={<VerificarRecibo />} />
                
                {/* Dynamic routes - respect app_pages.is_public setting */}
                <Route path="/" element={<DynamicProtectedRoute pageId="home"><Index /></DynamicProtectedRoute>} />
                <Route path="/terapeutas" element={<DynamicProtectedRoute pageId="terapeutas"><Terapeutas /></DynamicProtectedRoute>} />
                <Route path="/terapeuta/:id" element={<DynamicProtectedRoute pageId="terapeutas"><ProfessionalProfile /></DynamicProtectedRoute>} />
                <Route path="/cursos" element={<DynamicProtectedRoute pageId="cursos"><Cursos /></DynamicProtectedRoute>} />
                <Route path="/curso/:id" element={<DynamicProtectedRoute pageId="cursos"><CursoDetalhe /></DynamicProtectedRoute>} />
                <Route path="/quiz" element={<DynamicProtectedRoute pageId="quiz"><Quiz /></DynamicProtectedRoute>} />
                <Route path="/radio" element={<DynamicProtectedRoute pageId="radio"><Radio /></DynamicProtectedRoute>} />
                <Route path="/futebol" element={<DynamicProtectedRoute pageId="futebol"><Futebol /></DynamicProtectedRoute>} />
                <Route path="/ranking" element={<DynamicProtectedRoute pageId="ranking"><Ranking /></DynamicProtectedRoute>} />
                <Route path="/loja" element={<DynamicProtectedRoute pageId="loja"><FanaticaShop /></DynamicProtectedRoute>} />
                <Route path="/loja/produto/:id" element={<DynamicProtectedRoute pageId="loja"><ProductDetail /></DynamicProtectedRoute>} />
                <Route path="/fanaticaze-tv" element={<DynamicProtectedRoute pageId="fanaticaze-tv"><FanaticazeTV /></DynamicProtectedRoute>} />
                <Route path="/osmf" element={<DynamicProtectedRoute pageId="osmf"><OSMF /></DynamicProtectedRoute>} />
                <Route path="/zona-mista" element={<DynamicProtectedRoute pageId="zona-mista"><ZonaMista /></DynamicProtectedRoute>} />
                <Route path="/setor-saude" element={<DynamicProtectedRoute pageId="setor-saude"><SetorSaude /></DynamicProtectedRoute>} />
                <Route path="/diario" element={<DynamicProtectedRoute pageId="diario"><Diario /></DynamicProtectedRoute>} />
                <Route path="/perfil" element={<DynamicProtectedRoute pageId="perfil"><Perfil /></DynamicProtectedRoute>} />
                <Route path="/meus-agendamentos" element={<DynamicProtectedRoute pageId="agendamentos"><MeusAgendamentos /></DynamicProtectedRoute>} />
                <Route path="/perfil/agendamentos" element={<DynamicProtectedRoute pageId="agendamentos"><MeusAgendamentos /></DynamicProtectedRoute>} />
                <Route path="/pagamentos" element={<DynamicProtectedRoute pageId="pagamentos"><Pagamentos /></DynamicProtectedRoute>} />
                <Route path="/perfil/pagamentos" element={<DynamicProtectedRoute pageId="pagamentos"><Pagamentos /></DynamicProtectedRoute>} />
                <Route path="/configuracoes" element={<DynamicProtectedRoute pageId="configuracoes"><Configuracoes /></DynamicProtectedRoute>} />
                <Route path="/perfil/notificacoes" element={<DynamicProtectedRoute pageId="notificacoes"><Notificacoes /></DynamicProtectedRoute>} />
                <Route path="/notificacoes" element={<DynamicProtectedRoute pageId="notificacoes"><Notificacoes /></DynamicProtectedRoute>} />
                <Route path="/pagamento/:id" element={<DynamicProtectedRoute pageId="terapeutas"><SessionPayment /></DynamicProtectedRoute>} />
                <Route path="/pagamento/confirmacao/:id" element={<DynamicProtectedRoute pageId="terapeutas"><PaymentConfirmation /></DynamicProtectedRoute>} />

                {/* Professional routes - always require login */}
                <Route path="/profissional" element={<ProtectedRoute><ProfessionalDashboard /></ProtectedRoute>} />
                <Route path="/fanatica-lab" element={<ProtectedRoute><FanaticaLab /></ProtectedRoute>} />
                <Route path="/fanatica-lab/notas-clinicas" element={<ProtectedRoute><ClinicalNotes /></ProtectedRoute>} />
                <Route path="/fanatica-lab/mapa-observacao" element={<ProtectedRoute><ObservationMap /></ProtectedRoute>} />
                <Route path="/fanatica-lab/plano-terapeutico" element={<ProtectedRoute><TherapeuticPlan /></ProtectedRoute>} />
                <Route path="/fanatica-lab/revisao-caso" element={<ProtectedRoute><CaseReview /></ProtectedRoute>} />
                <Route path="/fanatica-lab/biblioteca" element={<ProtectedRoute><ReferenceLibrary /></ProtectedRoute>} />
                <Route path="/fanatica-lab/modelo-recibo" element={<ProtectedRoute><ReceiptTemplate /></ProtectedRoute>} />
                <Route path="/psi-house" element={<ProtectedRoute><PsiHouse /></ProtectedRoute>} />
                <Route path="/conecta" element={<ProtectedRoute><Conecta /></ProtectedRoute>} />

                {/* Admin/Dev routes - always require login */}
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/developer" element={<ProtectedRoute><ContentManagers /></ProtectedRoute>} />
                <Route path="/developer/mobile" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />
                <Route path="/developer/desktop" element={<ProtectedRoute><DesktopContentManager /></ProtectedRoute>} />
                <Route path="/desenvolvedor" element={<ProtectedRoute><ContentManagers /></ProtectedRoute>} />
                <Route path="/desenvolvedor/mobile" element={<ProtectedRoute><DeveloperDashboard /></ProtectedRoute>} />
                <Route path="/desenvolvedor/desktop" element={<ProtectedRoute><DesktopContentManager /></ProtectedRoute>} />
                <Route path="/developer/notificacoes" element={<ProtectedRoute><NotificationManagerPage /></ProtectedRoute>} />
                <Route path="/desenvolvedor/notificacoes" element={<ProtectedRoute><NotificationManagerPage /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute><MarketingDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProviders>
          </BrowserRouter>
          </RadioProvider>
        </AuthProvider>
      )}
    </TooltipProvider>
    </MobileBrowserBlock>
  </QueryClientProvider>
  );
};

export default App;
