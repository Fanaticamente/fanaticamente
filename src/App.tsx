import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

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
import { ClubThemeProvider } from "@/contexts/ClubThemeContext";
import ProtectedRoute, { DynamicProtectedRoute } from "@/components/ProtectedRoute";
import { ROUTE_BASENAME, isProfessionalApp } from "@/lib/appMode";
import GlobalRadioPlayer from "@/components/radio/GlobalRadioPlayer";

import { useRealtimeSubscriptions } from "@/hooks/useRealtimeSubscriptions";
import { useGlobalSessionCompletion } from "@/hooks/useGlobalSessionCompletion";
import { useProfessionalSessionAlert } from "@/hooks/useProfessionalSessionAlert";
import MandatorySessionDialog from "@/components/professional/MandatorySessionDialog";
import { useDisableServiceWorkerOnManagerRoutes } from "@/hooks/useDisableServiceWorkerOnManagerRoutes";
import { useViewportHeightSync } from "@/hooks/useViewportHeightSync";
import SessionCompletedDialog from "@/components/user/SessionCompletedDialog";
import MobileBrowserBlock from "@/components/MobileBrowserBlock";
import Index from "./pages/Index";
import Terapeutas from "./pages/Terapeutas";
import AgendarSessao from "./pages/AgendarSessao";
import SessionPayment from "./pages/SessionPayment";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Cursos from "./pages/Cursos";
import CursoDetalhe from "./pages/CursoDetalhe";
import MeusCursos from "./pages/MeusCursos";
import Quiz from "./pages/Quiz";
import Diario from "./pages/Diario";
import MinhaTemporada from "./pages/MinhaTemporada";
import BemEstar from "./pages/BemEstar";
import Radio from "./pages/Radio";
import RadioStation from "./pages/RadioStation";
import Futebol from "./pages/Futebol";
import Perfil from "./pages/Perfil";
import EditarPerfil from "./pages/EditarPerfil";
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
import PrivacyPolicyProfessional from "./pages/PrivacyPolicyProfessional";
import TermsOfUse from "./pages/TermsOfUse";
import TermsOfUseProfessional from "./pages/TermsOfUseProfessional";
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
import Comunidade from "./pages/Comunidade";
import Notificacoes from "./pages/Notificacoes";
import VerificarRecibo from "./pages/VerificarRecibo";
import NotificationManagerPage from "./pages/NotificationManagerPage";
import ActivitiesManagerPage from "./pages/ActivitiesManagerPage";
import FanaticazeTV from "./pages/FanaticazeTV";
import SetorSaude from "./pages/SetorSaude";
import MarketingDashboard from "./pages/MarketingDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Phase 3 scaling: serve from cache first, revalidate in background.
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    },
  },
});

// Persisted cache: repeat visits render instantly from localStorage and only
// hit the backend for revalidation, cutting read load at high concurrency.
const persister =
  typeof window !== "undefined"
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: "fanatica-query-cache",
        throttleTime: 2000,
      })
    : undefined;

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
  const { sessionAlert, clearSessionAlert } = useProfessionalSessionAlert();

  return (
    <>
      {children}
      {sessionAlert && (
        <MandatorySessionDialog
          appointment={sessionAlert}
          onFinished={(id) => clearSessionAlert(id)}
        />
      )}
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
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: persister!,
      maxAge: 24 * 60 * 60 * 1000,
      dehydrateOptions: {
        // Never persist user-sensitive or auth-bound data
        shouldDehydrateQuery: (query) => {
          const key = JSON.stringify(query.queryKey).toLowerCase();
          if (query.state.status !== "success") return false;
          return !/(profile|auth|appointment|receipt|notification|payment|membership|admin|professional-private|user-)/.test(key);
        },
      },
    }}
  >
    <MobileBrowserBlock>
    <TooltipProvider>
      {isEmbedMode() ? (
        <AuthProvider>
          <ClubThemeProvider>
          <RadioProvider>
          <BrowserRouter basename={ROUTE_BASENAME || undefined}>
            <Toaster />
            <Sonner />
            <GlobalRadioPlayer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/terapeutas" element={<Terapeutas />} />
              <Route path="/terapeuta/:id" element={<AgendarSessao />} />
              <Route path="/agendar/:id" element={<AgendarSessao />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/curso/:id" element={<CursoDetalhe />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/radio/:id" element={<RadioStation />} />
              <Route path="/futebol" element={<Futebol />} />
              <Route path="/comunidade" element={<Comunidade />} />
              <Route path="/loja" element={<FanaticaShop />} />
              <Route path="/loja/produto/:id" element={<ProductDetail />} />
              <Route path="/osmf" element={<OSMF />} />
              <Route path="/zona-mista" element={<ZonaMista />} />
              <Route path="/setor-saude" element={<SetorSaude />} />
              <Route path="/politica-privacidade" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/politica-privacidade-profissional" element={<PrivacyPolicyProfessional />} />
              <Route path="/privacy-policy-professional" element={<PrivacyPolicyProfessional />} />
              <Route path="/termos-de-uso" element={<TermsOfUse />} />
              <Route path="/terms-of-use" element={<TermsOfUse />} />
                <Route path="/termos-de-uso-profissional" element={<TermsOfUseProfessional />} />
                <Route path="/terms-of-use-professional" element={<TermsOfUseProfessional />} />
              <Route path="/verificar-recibo/:numero" element={<VerificarRecibo />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </RadioProvider>
          </ClubThemeProvider>
        </AuthProvider>
      ) : (
        <AuthProvider>
          <ClubThemeProvider>
          <RadioProvider>
          <BrowserRouter basename={ROUTE_BASENAME || undefined}>
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
                <Route path="/politica-privacidade-profissional" element={<PrivacyPolicyProfessional />} />
                <Route path="/privacy-policy-professional" element={<PrivacyPolicyProfessional />} />
                <Route path="/termos-de-uso" element={<TermsOfUse />} />
                <Route path="/terms-of-use" element={<TermsOfUse />} />
                <Route path="/termos-de-uso-profissional" element={<TermsOfUseProfessional />} />
                <Route path="/terms-of-use-professional" element={<TermsOfUseProfessional />} />
                <Route path="/setup-test" element={<SetupTestUsers />} />
                <Route path="/verificar-recibo/:numero" element={<VerificarRecibo />} />
                
                {/* Dynamic routes - respect app_pages.is_public setting */}
                <Route path="/" element={<DynamicProtectedRoute pageId="home"><Index /></DynamicProtectedRoute>} />
                <Route path="/terapeutas" element={<DynamicProtectedRoute pageId="terapeutas"><Terapeutas /></DynamicProtectedRoute>} />
                <Route path="/terapeuta/:id" element={<DynamicProtectedRoute pageId="terapeutas"><AgendarSessao /></DynamicProtectedRoute>} />
              <Route path="/agendar/:id" element={<DynamicProtectedRoute pageId="terapeutas"><AgendarSessao /></DynamicProtectedRoute>} />
                <Route path="/cursos" element={<DynamicProtectedRoute pageId="cursos"><Cursos /></DynamicProtectedRoute>} />
                <Route path="/curso/:id" element={<DynamicProtectedRoute pageId="cursos"><CursoDetalhe /></DynamicProtectedRoute>} />
                <Route path="/meus-cursos" element={<ProtectedRoute><MeusCursos /></ProtectedRoute>} />
                <Route path="/quiz" element={<DynamicProtectedRoute pageId="quiz"><Quiz /></DynamicProtectedRoute>} />
                <Route path="/radio" element={<DynamicProtectedRoute pageId="radio"><Radio /></DynamicProtectedRoute>} />
                <Route path="/radio/:id" element={<DynamicProtectedRoute pageId="radio"><RadioStation /></DynamicProtectedRoute>} />
                <Route path="/futebol" element={<DynamicProtectedRoute pageId="futebol"><Futebol /></DynamicProtectedRoute>} />
                <Route path="/comunidade" element={<DynamicProtectedRoute pageId="ranking"><Comunidade /></DynamicProtectedRoute>} />
                <Route path="/loja" element={<DynamicProtectedRoute pageId="loja"><FanaticaShop /></DynamicProtectedRoute>} />
                <Route path="/loja/produto/:id" element={<DynamicProtectedRoute pageId="loja"><ProductDetail /></DynamicProtectedRoute>} />
                <Route path="/fanaticaze-tv" element={<DynamicProtectedRoute pageId="fanaticaze-tv"><FanaticazeTV /></DynamicProtectedRoute>} />
                <Route path="/osmf" element={<DynamicProtectedRoute pageId="osmf"><OSMF /></DynamicProtectedRoute>} />
                <Route path="/zona-mista" element={<DynamicProtectedRoute pageId="zona-mista"><ZonaMista /></DynamicProtectedRoute>} />
                <Route path="/setor-saude" element={<DynamicProtectedRoute pageId="setor-saude"><SetorSaude /></DynamicProtectedRoute>} />
                <Route path="/diario" element={<DynamicProtectedRoute pageId="diario"><Diario /></DynamicProtectedRoute>} />
                <Route path="/minha-temporada" element={<DynamicProtectedRoute pageId="minha-temporada"><MinhaTemporada /></DynamicProtectedRoute>} />
                <Route path="/bem-estar" element={<DynamicProtectedRoute pageId="diario"><BemEstar /></DynamicProtectedRoute>} />
                <Route path="/perfil" element={<DynamicProtectedRoute pageId="perfil"><Perfil /></DynamicProtectedRoute>} />
                <Route path="/perfil/editar" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
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
                <Route path="/developer/atividades" element={<ProtectedRoute><ActivitiesManagerPage /></ProtectedRoute>} />
                <Route path="/desenvolvedor/notificacoes" element={<ProtectedRoute><NotificationManagerPage /></ProtectedRoute>} />
                <Route path="/marketing" element={<ProtectedRoute><MarketingDashboard /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppProviders>
          </BrowserRouter>
          </RadioProvider>
          </ClubThemeProvider>
        </AuthProvider>
      )}
    </TooltipProvider>
    </MobileBrowserBlock>
  </PersistQueryClientProvider>
  );
};

export default App;
