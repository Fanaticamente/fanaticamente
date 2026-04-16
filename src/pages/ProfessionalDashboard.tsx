import { useState, useEffect, useLayoutEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, Users, TrendingUp, LogOut, Plus, CheckCircle, XCircle, Edit2, ChevronRight, User, ChevronLeft, Upload, Lock, Loader2 } from "lucide-react";
import AccountSettingsDialog from "@/components/profile/AccountSettingsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

import ProfileCompletionForm from "@/components/professional/ProfileCompletionForm";
import OnboardingWizard from "@/components/professional/onboarding/OnboardingWizard";
import SubscriptionPlans from "@/components/professional/SubscriptionPlans";
import StripeConnectCard from "@/components/professional/StripeConnectCard";
import PixPaymentCard from "@/components/professional/PixPaymentCard";
import SubscriptionManager from "@/components/professional/SubscriptionManager";
import AppointmentDetailsDialog from "@/components/professional/AppointmentDetailsDialog";
import AdminMessagesAlert from "@/components/professional/AdminMessagesAlert";
import ApprovalPendingBanner from "@/components/professional/ApprovalPendingBanner";
import WeeklyAvailabilityManager from "@/components/professional/WeeklyAvailabilityManager";
import ProfessionalMetricsTab from "@/components/professional/ProfessionalMetricsTab";
import RejectAppointmentDialog from "@/components/professional/RejectAppointmentDialog";
import AISecretaryChat from "@/components/professional/AISecretaryChat";
import RefundPendingCard from "@/components/professional/RefundPendingCard";
import ProfessionalBottomNav from "@/components/layout/ProfessionalBottomNav";
import ProfessionalDesktopLayout from "@/components/layout/ProfessionalDesktopLayout";
import { useIsMobile } from "@/hooks/use-mobile";

interface Professional {
  id: string;
  user_id: string;
  crp: string;
  bio: string | null;
  degree: string | null;
  experience_years: number | null;
  hourly_rate: number | null;
  specialties: string[] | null;
  is_active: boolean;
  is_verified: boolean;
  subscription_type: string | null;
  subscription_expires_at: string | null;
  location: string | null;
  approval_status: string | null;
  rejection_reason: string | null;
  crp_document_front_url: string | null;
  crp_document_back_url: string | null;
  degree_document_front_url: string | null;
  degree_document_back_url: string | null;
  google_calendar_url: string | null;
  socio_consciente: boolean;
}

interface Profile {
  full_name: string | null;
  favorite_club_id: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
}

interface Club {
  id: string;
  name: string;
  primary_color: string;
  badge_url: string | null;
}

type OnboardingStep = "status" | "profile" | "subscription";
type DashboardTab = "agenda" | "disponibilidade" | "metricas" | "perfil" | "assinatura";
type AppointmentFilter = "proximos" | "realizados" | "cancelados" | "todos";

const ProfessionalDashboard = () => {
  const isMobile = useIsMobile();
  const { user, signOut, hasRole } = useAuth();

  // Force light theme for professional dashboard
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
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupError, setSetupError] = useState(false);
  
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>("status");
  const [homeTab, setHomeTab] = useState<DashboardTab | null>(null);
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>("proximos");
  const [hasNewAppointments, setHasNewAppointments] = useState(false);
  const [lastSeenAppointmentCount, setLastSeenAppointmentCount] = useState<number | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [rejectingAppointment, setRejectingAppointment] = useState<any | null>(null);

  const [hasSyncedSubscription, setHasSyncedSubscription] = useState(false);

  // Read tab from URL query params (e.g. /profissional?tab=agenda)
  // Focused routes render only the selected section; the home route always opens the dashboard start view.
  const tabParam = searchParams.get("tab") as DashboardTab | null;
  const isFocusedMode = tabParam !== null && ["agenda", "disponibilidade", "metricas", "perfil", "assinatura"].includes(tabParam);
  const activeTab = isFocusedMode && tabParam ? tabParam : homeTab;

  useLayoutEffect(() => {
    if (isFocusedMode) {
      return;
    }

    if (!professional) {
      setHomeTab(null);
      return;
    }

    setHomeTab(professional.is_active ? "agenda" : "perfil");
  }, [isFocusedMode, professional?.id, professional?.is_active]);

  // Check for checkout success and verify subscription
  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");

    if (checkoutStatus === "success") {
      // Clear URL params first
      setSearchParams({});
      // Verify subscription with Stripe
      verifySubscriptionAfterPayment();
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout cancelado");
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const verifySubscriptionAfterPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-professional-subscription");

      if (error) {
        console.error("Error verifying subscription:", error);
        toast.error("Não foi possível verificar a assinatura. Aguarde alguns instantes e recarregue a página.");
        return;
      }

      if (data?.subscribed) {
        toast.success("Assinatura realizada com sucesso! Seus dados foram enviados para análise.", {
          duration: 6000,
        });
        fetchProfessionalData();
      } else {
        // Retry after 3 seconds if not found immediately
        setTimeout(async () => {
          const { data: retryData } = await supabase.functions.invoke("check-professional-subscription");
          if (retryData?.subscribed) {
            toast.success("Assinatura realizada com sucesso! Seus dados foram enviados para análise.", {
              duration: 6000,
            });
            fetchProfessionalData();
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const verifySubscriptionSilent = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-professional-subscription");
      if (!error && data?.subscribed) {
        fetchProfessionalData();
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  useEffect(() => {
    if (!hasRole("professional")) {
      navigate("/");
      return;
    }
    fetchProfessionalData();
  }, [hasRole, navigate, user]);

  // If the user has a professional role but no professional record exists,
  // treat it as an invalid/non-registered account and send them back to login.
  useEffect(() => {
    if (!setupError) return;

    toast.error("Conta inválida ou não cadastrada. Revise os dados ou cadastre-se.");

    // Fire-and-forget: avoid rendering intermediate "redirecionando" screens.
    void signOut();
    navigate("/auth?mode=professional", { replace: true });
  }, [setupError, signOut, navigate]);

  const fetchProfessionalData = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, favorite_club_id, avatar_url, city, state")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        // Fetch club data if user has favorite club
        if (profileData.favorite_club_id) {
            const { data: clubData } = await supabase
              .from("clubs")
              .select("id, name, primary_color, badge_url")
              .eq("id", profileData.favorite_club_id)
              .maybeSingle();

          if (clubData) {
            setClub(clubData);
          }
        }
      }

      // Fetch professional record
      let { data: profData } = await supabase
        .from("professionals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profData) {
        // Professional record doesn't exist - try to complete signup via edge function
        const pendingData = localStorage.getItem('pendingProfileUpdate');
        
        if (pendingData) {
          const parsed = JSON.parse(pendingData);
          const crp = parsed.crp;
          
          if (crp) {
            console.log("[Dashboard] Retrying professional signup via edge function");
            const { crp: pendingCrp, ...profileFields } = parsed;
            
            const { error: fnError } = await supabase.functions.invoke("complete-professional-signup", {
              body: {
                crp: pendingCrp,
                profile: profileFields,
              },
            });

            if (!fnError) {
              console.log("[Dashboard] Professional signup completed, refetching data");
              localStorage.removeItem('pendingProfileUpdate');
              
              // Refetch professional data
              const { data: newProfData } = await supabase
                .from("professionals")
                .select("*")
                .eq("user_id", user.id)
                .single();
              
              profData = newProfData;
            } else {
              console.error("[Dashboard] Edge function failed:", fnError);
              toast.error("Erro ao completar cadastro profissional. Tente novamente.");
            }
          }
        }
        
        if (!profData) {
          console.log("[Dashboard] No professional record found and no pending CRP data");
          setSetupError(true);
          setIsLoading(false);
          return;
        }
      }

      if (profData) {
        setProfessional(profData);

        // Determine onboarding step
        const profileComplete = !!(profData.bio && profData.degree && profData.specialties?.length);
        // Consider subscription active if has type OR valid expires_at OR approved status
        const hasSubscription = !!profData.subscription_type || 
          (profData.subscription_expires_at && new Date(profData.subscription_expires_at) > new Date()) ||
          profData.approval_status === 'approved' ||
          profData.approval_status === 'pending_cancellation';

        if (!profileComplete) {
          setOnboardingStep("profile");
        } else if (!hasSubscription) {
          setOnboardingStep("subscription");
        } else {
          setOnboardingStep("status");
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isProfileComplete = !!(professional?.bio && professional?.degree && professional?.specialties?.length);
  // Consider subscription active if has subscription_type OR has valid expires_at OR approved status
  const hasSubscription = !!(professional?.subscription_type || 
    (professional?.subscription_expires_at && new Date(professional.subscription_expires_at) > new Date()) ||
    professional?.approval_status === 'approved' ||
    professional?.approval_status === 'pending_cancellation');
  const isMarketplaceActive = !!professional?.is_active;

  // Load last seen timestamp from localStorage and restore non-navigation UI state.
  // The home route must always open the dashboard start view, so we do not restore the last saved tab here.
  useEffect(() => {
    if (!professional) return;

    const stored = localStorage.getItem(`lastSeenAppointmentsTime_${professional.id}`);
    if (stored) {
      setLastSeenAppointmentCount(parseInt(stored, 10));
    } else {
      // If never seen, set to 0 so any appointment will trigger notification
      setLastSeenAppointmentCount(0);
    }

    const uiStateKey = `professional_dashboard_ui_${professional.id}`;

    try {
      const raw = localStorage.getItem(uiStateKey);
      const parsed = raw ? (JSON.parse(raw) as Partial<{
        activeTab: DashboardTab;
        appointmentFilter: AppointmentFilter;
        isEditingProfile: boolean;
      }>) : null;

      const savedFilter = parsed?.appointmentFilter;
      const savedEditing = parsed?.isEditingProfile;

      if (savedFilter) setAppointmentFilter(savedFilter);
      if (typeof savedEditing === "boolean") setIsEditingProfile(savedEditing);
    } catch {
      // Ignore invalid persisted UI state
    }
  }, [professional?.id]);

  // Persist dashboard UI state so that returning to the app resumes exactly where the user was.
  useEffect(() => {
    if (!professional || homeTab === null || isFocusedMode) return;

    const uiStateKey = `professional_dashboard_ui_${professional.id}`;

    try {
      localStorage.setItem(
        uiStateKey,
        JSON.stringify({
          activeTab: homeTab,
          appointmentFilter,
          isEditingProfile,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore
    }
  }, [professional, homeTab, isFocusedMode, appointmentFilter, isEditingProfile]);

  // Fetch appointments when professional is loaded and approved/active
  useEffect(() => {
    if (professional && isMarketplaceActive) {
      fetchAppointments();
    }
  }, [professional, isMarketplaceActive]);

  // Check for new appointments based on lastSeenAppointmentTime
  useEffect(() => {
    if (lastSeenAppointmentCount !== null && appointments.length > 0 && activeTab !== 'agenda') {
      // Check if there are appointments created after last seen time
      const lastSeenTime = lastSeenAppointmentCount;
      const hasNewOnes = appointments.some(apt => {
        const createdAt = new Date(apt.created_at).getTime();
        return createdAt > lastSeenTime && apt.status === 'pending';
      });
      if (hasNewOnes) {
        setHasNewAppointments(true);
      }
    }
  }, [appointments, lastSeenAppointmentCount, activeTab]);

  // Realtime subscription for new appointments
  useEffect(() => {
    if (!professional || !isMarketplaceActive) return;

    const channel = supabase
      .channel('professional-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `professional_id=eq.${professional.id}`
        },
        (payload) => {
          console.log('[Dashboard] New appointment received:', payload);
          // Only set notification if not currently on agenda tab
          if (activeTab !== 'agenda') {
            setHasNewAppointments(true);
          }
          // Refresh appointments list
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [professional, isMarketplaceActive, activeTab]);

  // If the user paid but the status is still "pending_payment", sync with billing provider.
  useEffect(() => {
    if (!professional || hasSyncedSubscription) return;

    if (professional.approval_status === "pending_payment") {
      setHasSyncedSubscription(true);
      verifySubscriptionSilent();
    }
  }, [professional, hasSyncedSubscription]);

  const fetchAppointments = async () => {
    if (!professional) return;
    setLoadingAppointments(true);
    
    try {
      // First fetch appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('professional_id', professional.id)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(appointmentsData.map(a => a.user_id))];

      // Fetch profiles for those users (including birth_date for age calculation and city)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, phone, birth_date, city')
        .in('user_id', userIds);

      // Fetch user emails via edge function
      let emailsMap = new Map<string, string>();
      try {
        const { data: emailsData } = await supabase.functions.invoke('get-user-emails', {
          body: { userIds }
        });
        if (emailsData?.emails) {
          emailsMap = new Map(Object.entries(emailsData.emails));
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      }

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Map profiles to appointments
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      const enrichedAppointments = appointmentsData.map(apt => ({
        ...apt,
        profiles: profilesMap.get(apt.user_id) || null,
        user_email: emailsMap.get(apt.user_id) || null
      }));

      setAppointments(enrichedAppointments);

      // Check for new appointments (comparing count with last seen)
      if (lastSeenAppointmentCount !== null && enrichedAppointments.length > lastSeenAppointmentCount) {
        setHasNewAppointments(true);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      
      toast.success(newStatus === 'confirmed' ? 'Agendamento confirmado!' : 'Agendamento recusado');
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  };

  const handleViewReceipt = async (receiptPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(receiptPath, 3600); // 1 hour expiry

      if (error) throw error;
      
      if (data?.signedUrl) {
        setSelectedReceipt(data.signedUrl);
      }
    } catch (error) {
      console.error('Error getting receipt:', error);
      toast.error('Erro ao carregar comprovante');
    }
  };

  // Calculate stats based on completed consultations only
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const pendingAppointments = appointments.filter(a => ['pending', 'confirmed', 'link_sent', 'in_progress'].includes(a.status));
  const cancelledAppointments = appointments.filter(a => ['cancelled', 'refund_pending', 'refund_sent', 'disputed'].includes(a.status));
  const totalRelevantAppointments = appointments.filter(a => !['cancelled', 'refund_pending', 'refund_sent', 'disputed'].includes(a.status));
  
  // Calculate completion rate (completed / (completed + cancelled))
  const totalFinished = completedAppointments.length + cancelledAppointments.length;
  const completionRate = totalFinished > 0 ? Math.round((completedAppointments.length / totalFinished) * 100) : 0;
  
  const stats = [
    { label: "Consultas este mês", value: isMarketplaceActive ? completedAppointments.length.toString() : "0", icon: Calendar, color: "text-therapy" },
    { label: "Pacientes atendidos", value: isMarketplaceActive ? completedAppointments.length.toString() : "0", icon: Users, color: "text-primary" },
    { label: "Taxa de conclusão", value: isMarketplaceActive ? `${completionRate}%` : "0%", icon: TrendingUp, color: completionRate >= 80 ? "text-green-500" : completionRate >= 50 ? "text-yellow-500" : "text-red-500" },
    { label: "Pendentes", value: isMarketplaceActive ? pendingAppointments.length.toString() : "0", icon: Clock, color: "text-yellow-500" },
  ];

  // Clear new appointments badge when visiting the agenda tab
  const handleTabChange = (tabId: DashboardTab) => {
    setHomeTab(tabId);
    if (tabId === "agenda" && professional) {
      setHasNewAppointments(false);
      // Save current timestamp as last seen time
      const now = Date.now();
      localStorage.setItem(`lastSeenAppointmentsTime_${professional.id}`, now.toString());
      setLastSeenAppointmentCount(now);
    }
  };

  // Filter appointments for display
  const getFilteredAppointments = () => {
    if (appointmentFilter === "proximos") {
      // "Próximos" = pending, confirmed, link_sent, in_progress (not completed, cancelled, or refund related)
      return appointments.filter(a => ['pending', 'confirmed', 'link_sent', 'in_progress'].includes(a.status));
    } else if (appointmentFilter === "realizados") {
      return appointments.filter(a => a.status === 'completed');
    } else if (appointmentFilter === "cancelados") {
      // Cancelled includes: cancelled, refund_pending, refund_sent, disputed
      return appointments.filter(a => ['cancelled', 'refund_pending', 'refund_sent', 'disputed'].includes(a.status));
    }
    return appointments; // "todos"
  };

  const filteredAppointments = getFilteredAppointments();
  const proximosCount = appointments.filter(a => ['pending', 'confirmed', 'link_sent', 'in_progress'].includes(a.status)).length;
  const realizadosCount = appointments.filter(a => a.status === 'completed').length;
  const canceladosCount = appointments.filter(a => ['cancelled', 'refund_pending', 'refund_sent', 'disputed'].includes(a.status)).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleProfileComplete = () => {
    setOnboardingStep("subscription");
    fetchProfessionalData();
  };

  const handleSubscriptionComplete = () => {
    setOnboardingStep("status");
    fetchProfessionalData();
  };

  if (isLoading || activeTab === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[hsl(145,63%,42%)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (setupError) {
    // Nothing should appear here besides the toast message.
    return null;
  }

  // Desktop wrapper component
  const DesktopWrapper = ({ children }: { children: React.ReactNode }) => (
    <ProfessionalDesktopLayout>
      <div className="flex items-center gap-3 mb-6">
        {profile?.avatar_url ? (
          <div className="w-12 h-12 rounded-full overflow-hidden shadow-md flex-shrink-0">
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover object-top"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl text-therapy">
            Painel Profissional
          </h1>
          <p className="text-muted-foreground text-sm">
            {profile?.full_name || user?.email} {club && `• ${club.name}`}
          </p>
        </div>
        <div className="ml-auto">
          <AccountSettingsDialog isProfessional={true} />
        </div>
      </div>
      {children}
    </ProfessionalDesktopLayout>
  );

  // Mobile header component
  const MobileHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))]">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {profile?.avatar_url ? (
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-md flex-shrink-0">
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover object-top"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg sm:text-xl text-therapy whitespace-nowrap">
              Painel Profissional
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm truncate">
              {profile?.full_name || user?.email} {club && `• ${club.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <AccountSettingsDialog isProfessional={true} />
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );

  // Onboarding wizard content (shown when profile is not complete)
  const onboardingContent = professional && !isProfileComplete ? (
    <div className="py-4">
      <OnboardingWizard
        professionalId={professional.id}
        existingData={{
          imageUrl: profile?.avatar_url || "",
          crpDocumentFrontUrl: professional.crp_document_front_url || "",
          crpDocumentBackUrl: professional.crp_document_back_url || "",
          degreeDocumentFrontUrl: professional.degree_document_front_url || "",
          degreeDocumentBackUrl: professional.degree_document_back_url || "",
          bio: professional.bio || "",
          specialties: professional.specialties || [],
          sessionPrice: professional.hourly_rate?.toString() || "",
          socioConsciente: professional.socio_consciente || false,
        }}
        onComplete={() => {
          fetchProfessionalData();
        }}
      />
    </div>
  ) : null;

  // Main dashboard content (shared between mobile and desktop)
  const dashboardContent = (
    <>
      {/* Admin Messages Alert - shown on all tabs (focused and home) */}
      {professional && (
        <AdminMessagesAlert professionalId={professional.id} />
      )}

      {/* Approval Status Banner - shown on all tabs; hide only on assinatura tab when pending_approval (shown inside SubscriptionManager) */}
      {professional && !(activeTab === 'assinatura' && professional.approval_status === 'pending_approval') && (
        <ApprovalPendingBanner
          approvalStatus={professional.approval_status}
          rejectionReason={professional.rejection_reason}
          onResubmit={async () => {
            try {
              const { error } = await supabase
                .from('professionals')
                .update({ approval_status: 'pending_approval', rejection_reason: null })
                .eq('id', professional.id);
              
              if (error) throw error;

              await supabase
                .from('admin_messages')
                .update({ is_read: true })
                .eq('professional_id', professional.id);

              toast.success("Perfil reenviado para análise!");
              fetchProfessionalData();
            } catch (error) {
              console.error("Error resubmitting:", error);
              toast.error("Erro ao reenviar perfil");
            }
          }}
        />
      )}

      {/* Full dashboard chrome - only when NOT in focused mode */}
      {!isFocusedMode && (
        <>
          {/* AI Secretary Chat */}
          {professional && professional.is_active && activeTab === "agenda" && (
            <AISecretaryChat professionalId={professional.id} />
          )}

          {/* Tabs - Order changes based on approval status */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 pt-2 -mt-2">
            {(isMarketplaceActive ? [
              { id: "agenda", label: "Agendamentos", locked: false, hasNotification: hasNewAppointments },
              { id: "disponibilidade", label: "Disponibilidade", locked: false },
              { id: "metricas", label: "Métricas", locked: false },
              { id: "perfil", label: "Meu Perfil", locked: false },
              { id: "assinatura", label: "Assinatura", locked: false },
            ] : [
              { id: "perfil", label: "Meu Perfil", locked: false },
              { id: "assinatura", label: "Assinatura", locked: false },
              { id: "agenda", label: "Agendamentos", locked: true },
              { id: "disponibilidade", label: "Disponibilidade", locked: true },
              { id: "metricas", label: "Métricas", locked: true },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.locked) {
                    toast.info("Complete sua assinatura para acessar esta funcionalidade");
                    return;
                  }
                  handleTabChange(tab.id as DashboardTab);
                }}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 relative overflow-visible ${
                  activeTab === tab.id
                    ? "bg-therapy text-therapy-foreground"
                    : tab.locked 
                      ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
                {tab.locked && <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />}
                {'hasNotification' in tab && tab.hasNotification && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Onboarding Progress (only shown before subscription) */}
          {!hasSubscription && (
            <div className="bg-card border border-border rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setHomeTab("perfil")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isProfileComplete ? "bg-therapy/20 text-therapy" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                    {isProfileComplete ? <CheckCircle className="w-4 h-4" /> : "1"}
                  </span>
                  <span className="text-sm font-medium hidden sm:inline">Completar Perfil</span>
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <button
                  onClick={() => setHomeTab("assinatura")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    hasSubscription ? "bg-therapy/20 text-therapy" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-bold">
                    {hasSubscription ? <CheckCircle className="w-4 h-4" /> : "2"}
                  </span>
                  <span className="text-sm font-medium hidden sm:inline">Assinar Plano</span>
                </button>
              </div>
            </div>
          )}

          {/* Stats (only shown when approved/active AND on agenda tab) */}
          {isMarketplaceActive && activeTab === "agenda" && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-muted-foreground text-sm">{stat.label}</span>
                  </div>
                  <p className="font-display text-3xl text-card-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

        {/* Perfil Tab */}
        {activeTab === "perfil" && professional && (
          <div className="space-y-6">
            {!isEditingProfile ? (
              <>
                {/* Profile Summary View */}
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-xl bg-therapy/20 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Foto profissional"
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <User className="w-10 h-10 text-therapy" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl text-card-foreground mb-1">
                        {profile?.full_name || "Nome não informado"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        CRP: {professional.crp}
                      </p>
                      {professional.degree && (
                        <p className="text-muted-foreground text-sm">
                          {professional.degree}
                        </p>
                      )}
                    </div>
                  </div>

                  {professional.bio && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Bio</p>
                      <p className="text-card-foreground text-sm line-clamp-2">
                        {professional.bio}
                      </p>
                    </div>
                  )}

                  {professional.specialties && professional.specialties.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Especialidades</p>
                      <div className="flex flex-wrap gap-2">
                        {professional.specialties.slice(0, 4).map((specialty) => (
                          <span
                            key={specialty}
                            className="px-3 py-1 bg-therapy/20 text-therapy text-xs rounded-full"
                          >
                            {specialty}
                          </span>
                        ))}
                        {professional.specialties.length > 4 && (
                          <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                            +{professional.specialties.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {professional.hourly_rate && (
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-muted-foreground">Valor da sessão</span>
                      <span className="font-bold text-card-foreground">
                        R$ {professional.hourly_rate.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full py-3 bg-therapy text-therapy-foreground rounded-xl font-medium hover:bg-therapy/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar Cadastro Profissional
                  </button>
                </div>
                
                {/* Payment Cards - Always visible */}
                <div className="space-y-4">
                  <h3 className="font-display text-xl text-card-foreground">
                    Métodos de Recebimento
                  </h3>
                  <PixPaymentCard 
                    professionalId={professional.id}
                    pixKey={(professional as any).pix_key || null} 
                    onUpdate={fetchProfessionalData}
                  />
                  <StripeConnectCard professionalId={professional.id} />
                </div>
              </>
            ) : (
              <>
                {/* Edit Profile Form */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-2xl text-card-foreground">
                    Editar Perfil
                  </h2>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
                <ProfileCompletionForm 
                  professionalId={professional.id}
                  existingData={{
                    bio: professional.bio || "",
                    degree: professional.degree || "",
                    specialties: professional.specialties || [],
                    sessionPrice: professional.hourly_rate?.toString() || "",
                    imageUrl: profile?.avatar_url || "",
                    crpDocumentFrontUrl: professional.crp_document_front_url || "",
                    crpDocumentBackUrl: professional.crp_document_back_url || "",
                    degreeDocumentFrontUrl: professional.degree_document_front_url || "",
                    degreeDocumentBackUrl: professional.degree_document_back_url || "",
                    socioConsciente: professional.socio_consciente || false
                  }}
                  onComplete={() => {
                    toast.success("Perfil atualizado!");
                    setIsEditingProfile(false);
                    fetchProfessionalData();
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Assinatura Tab */}
        {activeTab === "assinatura" && professional && (
          <div className="space-y-6">
            {hasSubscription || professional.approval_status === 'cancelled' || professional.approval_status === 'pending_approval' || professional.approval_status === 'approved' || professional.approval_status === 'pending_cancellation' ? (
              <SubscriptionManager 
                professionalId={professional.id}
                currentPlan={professional.subscription_type}
                expiresAt={professional.subscription_expires_at}
                approvalStatus={professional.approval_status}
                onUpdate={fetchProfessionalData}
              />
            ) : (
              <SubscriptionPlans 
                professionalId={professional.id}
                onSubscribe={handleSubscriptionComplete}
              />
            )}
          </div>
        )}

        {/* Content only available when approved by admin */}
        {isMarketplaceActive && (
          <>

            {/* Agenda Tab */}
            {activeTab === "agenda" && (
              <div className="space-y-4">
                <h2 className="font-display text-2xl text-card-foreground mb-4">
                  Agendamentos
                </h2>

                {/* Sub-filter tabs: Próximos, Realizados, Todos */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setAppointmentFilter("proximos")}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      appointmentFilter === "proximos"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Próximos
                    {proximosCount > 0 && (
                      <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        appointmentFilter === "proximos" ? "bg-white/20" : "bg-primary text-primary-foreground"
                      }`}>
                        {proximosCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAppointmentFilter("realizados")}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                      appointmentFilter === "realizados"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Realizados
                  </button>
                  <button
                    onClick={() => setAppointmentFilter("cancelados")}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                      appointmentFilter === "cancelados"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Cancelados
                    {canceladosCount > 0 && (
                      <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                        appointmentFilter === "cancelados" ? "bg-white/20" : "bg-red-500 text-white"
                      }`}>
                        {canceladosCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAppointmentFilter("todos")}
                    className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors ${
                      appointmentFilter === "todos"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Todos
                  </button>
                </div>
                
                {/* Refund Pending Cards - Show at top when there are pending refunds */}
                {appointments.filter(a => a.status === 'refund_pending' && a.user_pix_key).length > 0 && (
                  <div className="space-y-3 mb-4">
                    <h3 className="text-sm font-medium text-orange-600 uppercase tracking-wide flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ressarcimentos Pendentes
                    </h3>
                    {appointments
                      .filter(a => a.status === 'refund_pending' && a.user_pix_key)
                      .map(apt => (
                        <RefundPendingCard 
                          key={apt.id} 
                          appointment={apt} 
                          onUpdate={fetchAppointments} 
                        />
                      ))
                    }
                  </div>
                )}
                
                {loadingAppointments ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-therapy" />
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {appointmentFilter === "proximos" 
                        ? "Nenhum agendamento próximo" 
                        : appointmentFilter === "realizados" 
                        ? "Nenhuma consulta realizada"
                        : appointmentFilter === "cancelados"
                        ? "Nenhum agendamento cancelado"
                        : "Nenhum agendamento ainda"}
                    </p>
                  </div>
                ) : (
                  filteredAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-therapy/50 transition-colors"
                      onClick={(e) => {
                        // Don't open dialog if clicking on buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        setSelectedAppointment(apt);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-therapy/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-therapy" />
                          </div>
                          <div>
                            <h3 className="font-medium text-card-foreground">
                              {apt.profiles?.full_name || 'Paciente'}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                              {format(parseISO(apt.scheduled_date), "dd/MM/yyyy")} às {apt.scheduled_time}
                            </p>
                            {apt.profiles?.phone && (
                              <p className="text-muted-foreground text-xs mt-1">
                                Tel: {apt.profiles.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            apt.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-500"
                              : apt.status === "link_sent"
                              ? "bg-cyan-500/20 text-cyan-500"
                              : apt.status === "confirmed"
                              ? "bg-green-500/20 text-green-500"
                              : apt.status === "completed"
                              ? "bg-purple-500/20 text-purple-500"
                              : apt.status === "cancelled"
                              ? "bg-red-500/20 text-red-500"
                              : apt.status === "refund_pending"
                              ? "bg-orange-500/20 text-orange-500"
                              : apt.status === "refund_sent"
                              ? "bg-green-500/20 text-green-500"
                              : apt.status === "disputed"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {apt.status === "in_progress" 
                            ? "Em Atendimento" 
                            : apt.status === "link_sent"
                            ? "Link Enviado"
                            : apt.status === "confirmed" 
                            ? "Confirmado" 
                            : apt.status === "completed"
                            ? "Concluído"
                            : apt.status === "cancelled" 
                            ? "Recusado"
                            : apt.status === "refund_pending"
                            ? "Aguardando Ressarcimento"
                            : apt.status === "refund_sent"
                            ? "Ressarcimento Enviado"
                            : apt.status === "disputed"
                            ? "Em Disputa"
                            : "Pendente"}
                        </span>
                      </div>
                      
                      {/* Receipt Section */}
                      {apt.receipt_url && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewReceipt(apt.receipt_url);
                            }}
                            className="flex items-center gap-2 text-sm text-therapy hover:underline"
                          >
                            <Upload className="w-4 h-4" />
                            Ver Comprovante de Pagamento
                          </button>
                        </div>
                      )}
                      
                      {/* Action Buttons for Pending - Confirm keeps status pending, just validates receipt */}
                      {apt.status === "pending" && (
                        <div className="mt-4 pt-4 border-t border-border flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateAppointmentStatus(apt.id, 'confirmed');
                            }}
                            className="flex-1 py-2 bg-green-500/20 text-green-600 rounded-lg font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirmar
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectingAppointment(apt);
                            }}
                            className="flex-1 py-2 bg-red-500/20 text-red-600 rounded-lg font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}

                {/* Reject Appointment Dialog */}
                {rejectingAppointment && (
                  <RejectAppointmentDialog
                    appointment={rejectingAppointment}
                    onClose={() => setRejectingAppointment(null)}
                    onRejected={() => {
                      setRejectingAppointment(null);
                      fetchAppointments();
                    }}
                  />
                )}

                {/* Appointment Details Dialog */}
                {selectedAppointment && (
                  <AppointmentDetailsDialog
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                    onUpdate={() => {
                      fetchAppointments();
                      setSelectedAppointment(null);
                    }}
                  />
                )}

                {/* Receipt Modal */}
                {selectedReceipt && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
                    <div className="bg-card rounded-2xl max-w-lg w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between p-4 border-b border-border">
                        <h3 className="font-medium text-card-foreground">Comprovante de Pagamento</h3>
                        <button onClick={() => setSelectedReceipt(null)} className="p-2 hover:bg-muted rounded-lg">
                          <XCircle className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                      <div className="p-4">
                        {selectedReceipt.includes('.pdf') ? (
                          <a 
                            href={selectedReceipt} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-therapy hover:underline"
                          >
                            <Upload className="w-5 h-5" />
                            Abrir PDF em nova aba
                          </a>
                        ) : (
                          <img 
                            src={selectedReceipt} 
                            alt="Comprovante" 
                            className="w-full rounded-lg"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Disponibilidade Tab */}
            {activeTab === "disponibilidade" && professional && (
              <WeeklyAvailabilityManager
                professionalId={professional.id}
                onUpdate={fetchProfessionalData}
              />
            )}

            {/* Métricas Tab */}
            {activeTab === "metricas" && (
              <ProfessionalMetricsTab appointments={appointments} />
            )}

          </>
        )}
      </>
    );

  const showOnboarding = !!onboardingContent;
  const contentToRender = showOnboarding ? onboardingContent : dashboardContent;

  // Render desktop layout
  if (!isMobile) {
    return <DesktopWrapper>{contentToRender}</DesktopWrapper>;
  }

  // Render mobile layout
  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <main className="pt-[calc(env(safe-area-inset-top,0px)+4rem)] pb-8 px-4 max-w-6xl mx-auto">
        {contentToRender}
        {/* Bottom spacer for nav */}
        <div className="h-28" />
      </main>
      {!showOnboarding && <ProfessionalBottomNav />}
    </div>
  );
};

export default ProfessionalDashboard;
