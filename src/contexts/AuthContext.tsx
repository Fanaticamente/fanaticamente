import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearUserVideoProgress } from "@/hooks/useVideoProgress";
import { AccountType, encodeAuthEmail, getAccountTypeForAuth, isFanApp, isProfessionalApp } from "@/lib/appMode";


type AppRole = "user" | "professional" | "developer" | "admin" | "marketing";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    accountType?: AccountType
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string,
    accountType?: AccountType
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);

  const loading = authLoading || rolesLoading;

  const hasPendingProfessionalSignup = () => {
    try {
      const raw = sessionStorage.getItem("pendingProfileUpdate") || localStorage.getItem("pendingProfileUpdate");
      return raw ? !!JSON.parse(raw)?.is_professional : false;
    } catch {
      return false;
    }
  };

  const sessionIsCompatibleWithApp = (nextRoles: AppRole[]) => {
    const hasSupportAccess = nextRoles.includes("admin") || nextRoles.includes("developer");
    if (hasSupportAccess) return true;
    if (isFanApp) return !nextRoles.includes("professional");
    if (isProfessionalApp) return nextRoles.includes("professional") || hasPendingProfessionalSignup();
    return true;
  };

  const fetchUserRoles = async (userId: string) => {
    // Retry up to 3 times to avoid transient network failures wiping the roles
    // (which would falsely treat a professional as a regular user and log them out).
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (!error && data) {
        const nextRoles = data.map((r) => r.role as AppRole);
        setRoles(nextRoles);
        return nextRoles;
      }
      lastError = error;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    console.error("[Auth] Failed to fetch user roles after retries:", lastError);
    return null;
  };

  const enforceAppSessionBoundary = async (nextRoles: AppRole[]) => {
    if (sessionIsCompatibleWithApp(nextRoles)) return false;
    console.warn("[Auth] Sessão incompatível com este app; encerrando para impedir troca de ambiente.");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    return true;
  };

  // Function to complete professional signup via edge function
  const completeProfessionalSignup = async (userId: string, crp: string, profileFields: Record<string, any>, documentType?: string, documentNumber?: string) => {
    console.log("[Auth] Calling complete-professional-signup edge function for user:", userId, "CRP:", crp);
    
    const { data, error } = await supabase.functions.invoke("complete-professional-signup", {
      body: {
        crp,
        profile: profileFields,
        document_type: documentType,
        document_number: documentNumber,
      },
    });

    console.log("[Auth] Edge function response:", { data, error });

    if (error) {
      console.error("[Auth] Edge function failed:", error);
      return false;
    }

    console.log("[Auth] Professional signup completed successfully");
    await fetchUserRoles(userId);
    return true;
  };

  // Function to update pending profile data after signup
  // Uses sessionStorage for sensitive data (shorter exposure window than localStorage)
  const updatePendingProfileData = async (userId: string) => {
    // Check both sessionStorage (new) and localStorage (legacy fallback)
    let pendingData = sessionStorage.getItem("pendingProfileUpdate");
    let storageType: 'session' | 'local' = 'session';
    
    if (!pendingData) {
      pendingData = localStorage.getItem("pendingProfileUpdate");
      storageType = 'local';
    }
    
    if (!pendingData) {
      console.log("[Auth] No pending profile data found");
      return;
    }

    console.log("[Auth] Processing pending profile data");

    try {
      const profileData = JSON.parse(pendingData);
      const { crp, document_type, document_number, is_professional, ...profileFields } = profileData;

      // Clear sensitive data from storage as soon as we've read it
      const clearStorage = () => {
        sessionStorage.removeItem("pendingProfileUpdate");
        localStorage.removeItem("pendingProfileUpdate");
      };

      // Trigger professional setup if CRP provided OR explicit professional signup flag
      if (crp || is_professional) {
        console.log("[Auth] Professional signup detected", { hasCrp: !!crp, isProfessional: !!is_professional });
        
        const success = await completeProfessionalSignup(userId, crp || "", profileFields, document_type, document_number);
        
        if (success) {
          clearStorage();
        }
        // Keep pending data on failure so we can retry
        return;
      }

      // Regular user: just update profile fields
      console.log("[Auth] Regular user, updating profile fields");
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileFields)
        .eq("user_id", userId);

      if (!profileError) {
        console.log("[Auth] Profile updated successfully");
        clearStorage();
        // Notify club theme provider to re-fetch immediately so the app
        // adopts the chosen club colors right after signup.
        try {
          if (profileFields?.favorite_club_id) {
            localStorage.setItem("club-theme:clubId", profileFields.favorite_club_id);
          }
          window.dispatchEvent(new CustomEvent("club-theme-refresh"));
        } catch {}
      } else {
        console.error("[Auth] Profile update failed:", profileError);
      }
    } catch (error) {
      console.error("[Auth] Error updating pending profile data:", error);
      // Clear potentially corrupted data
      sessionStorage.removeItem("pendingProfileUpdate");
      localStorage.removeItem("pendingProfileUpdate");
    }
  };

  // Register user with OneSignal after login
  const registerOneSignalUser = async (userId: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignal = (window as any).OneSignal;
      if (OneSignal) {
        await OneSignal.login(userId);
        console.log("[OneSignal] User logged in with external_id:", userId);
      } else {
        // Try via deferred queue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deferred = (window as any).OneSignalDeferred;
        if (deferred) {
          deferred.push(async (os: any) => {
            await os.login(userId);
            console.log("[OneSignal] User logged in (deferred) with external_id:", userId);
          });
        }
      }
    } catch (e) {
      console.warn("[OneSignal] Could not register user:", e);
    }
  };

  const logoutOneSignalUser = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const OneSignal = (window as any).OneSignal;
      if (OneSignal) {
        await OneSignal.logout();
        console.log("[OneSignal] User logged out");
      }
    } catch (e) {
      console.warn("[OneSignal] Could not logout user:", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // TOKEN_REFRESHED / USER_UPDATED fire whenever the app resumes from
        // background (PWA on iOS/Android). Don't reset roles or trigger the
        // "Carregando..." spinner — keep the existing UI as-is.
        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setAuthLoading(false);
          return;
        }

        if (session?.user) {
          setRolesLoading(true);
          setRoles([]);
          setTimeout(() => {
            (async () => {
              try {
                const nextRoles = await fetchUserRoles(session.user.id);
                if (nextRoles && await enforceAppSessionBoundary(nextRoles)) return;
              } finally {
                setRolesLoading(false);
              }
              // Run side-effects AFTER releasing the loading flag so the UI
              // can redirect immediately. The professional record is created
              // asynchronously; the dashboard already retries if missing.
              updatePendingProfileData(session.user.id).catch((e) =>
                console.error("[Auth] pending profile update error:", e)
              );
              registerOneSignalUser(session.user.id);
            })();
          }, 0);
        } else {
          setRoles([]);
          setRolesLoading(false);
          logoutOneSignalUser();
        }

        setAuthLoading(false);
      }
    );

    // Timeout duro para getSession: se localStorage/IndexedDB estiver corrompido
    // (sintoma "funciona em aba anônima, não no normal"), getSession pode pendurar.
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null }; timedOut: true }>((resolve) => {
      window.setTimeout(() => resolve({ data: { session: null }, timedOut: true }), 5000);
    });

    Promise.race([sessionPromise, timeoutPromise]).then(async (result: any) => {
      if (result?.timedOut) {
        console.warn("[Auth] getSession timeout — limpando tokens corrompidos");
        try {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) keys.push(k);
          }
          keys.forEach((k) => localStorage.removeItem(k));
        } catch {}
        setSession(null);
        setUser(null);
        setRolesLoading(false);
        setAuthLoading(false);
        return;
      }
      const session = result?.data?.session ?? null;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setRolesLoading(true);
        try {
          const nextRoles = await fetchUserRoles(session.user.id);
          if (nextRoles && await enforceAppSessionBoundary(nextRoles)) {
            setAuthLoading(false);
            return;
          }
          // Register with OneSignal on session restore
          setTimeout(() => registerOneSignalUser(session.user.id), 2000);
        } finally {
          setRolesLoading(false);
        }
      } else {
        setRolesLoading(false);
      }

      setAuthLoading(false);
    }).catch((e) => {
      // Network failure during getSession() (common on iOS PWA/Capacitor when
      // resuming from background). Don't trap the user in an infinite spinner.
      console.error("[Auth] getSession failed:", e);
      setRolesLoading(false);
      setAuthLoading(false);
    });

    // Safety net: under no circumstances should the auth loading flags stay
    // true forever. If something hangs (no network, suspended worker, etc.)
    // force-release after 8s so ProtectedRoute can redirect to /auth instead
    // of showing the "Carregando..." spinner indefinitely.
    const safetyTimeout = window.setTimeout(() => {
      setAuthLoading((current) => {
        if (current) console.warn("[Auth] authLoading safety timeout reached");
        return false;
      });
      setRolesLoading((current) => {
        if (current) console.warn("[Auth] rolesLoading safety timeout reached");
        return false;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    accountType?: AccountType
  ) => {
    const type = accountType ?? getAccountTypeForAuth();
    // After email confirmation, send pro signups straight to the professional
    // dashboard (onboarding wizard) so they never land on the fan home — even
    // when the confirmation link is opened on a different device/browser where
    // sessionStorage is empty.
    const redirectUrl = `${window.location.origin}${type === "pro" ? "/profissional" : "/"}`;
    // ISOLAMENTO: contas torcedor e profissional são SEPARADAS mesmo com o mesmo
    // e-mail visível. Internamente codificamos com sub-addressing ("+fan"/"+pro")
    // para criar duas contas distintas no Supabase Auth.
    const internalEmail = encodeAuthEmail(email, type);

    const { error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          // Guardamos o e-mail "real" exibido ao usuário, separado do e-mail
          // interno usado pela autenticação.
          display_email: email.trim().toLowerCase(),
          account_type: type,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (
    email: string,
    password: string,
    accountType?: AccountType
  ) => {
    const type = accountType ?? getAccountTypeForAuth();
    const internalEmail = encodeAuthEmail(email, type);
    const rawEmail = email.trim().toLowerCase();

    // Resilient sign-in: some mobile networks / stale service workers cause
    // the very first fetch to fail with "TypeError: Failed to fetch" even
    // though the credentials are valid. Retry once before surfacing the
    // network error, and translate it into a friendlier message.
    const attempt = (mail: string) =>
      supabase.auth.signInWithPassword({ email: mail, password });

    const isNetworkError = (err: unknown) => {
      if (!err) return false;
      const msg = (err as Error)?.message?.toLowerCase?.() ?? "";
      return (
        err instanceof TypeError ||
        msg.includes("failed to fetch") ||
        msg.includes("networkerror") ||
        msg.includes("load failed")
      );
    };

    // Retorna true se a sessão recém-criada é COMPATÍVEL com este app.
      // - App/contexto torcedor: usuário NÃO pode ter role 'professional'
      // - App/contexto profissional: usuário PRECISA ter role 'professional'
    // (admin/developer sempre passam para preservar acesso de suporte)
    const sessionMatchesAccountType = async (userId: string): Promise<boolean> => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const roles = (data ?? []).map((r: any) => r.role as string);
      if (roles.includes("admin") || roles.includes("developer")) return true;
      return type === "pro" ? roles.includes("professional") : !roles.includes("professional");
    };

    try {
      // 1) Tenta o e-mail codificado (cadastro novo, isolado por app)
      let { error } = await attempt(internalEmail);
      if (error && isNetworkError(error)) {
        await new Promise((r) => setTimeout(r, 600));
        ({ error } = await attempt(internalEmail));
      }

      // 2) FALLBACK LEGADO: se a primeira tentativa falhou por credencial inválida,
      //    tenta o e-mail bruto (contas criadas ANTES do isolamento por app).
      //    Só aceita o login se as roles do usuário forem compatíveis com o app
      //    atual; caso contrário, força logout e devolve erro explicativo.
      if (error && !isNetworkError(error)) {
        const legacy = await attempt(rawEmail);
        if (!legacy.error) {
          const { data: sess } = await supabase.auth.getSession();
          const uid = sess.session?.user?.id;
          if (uid && (await sessionMatchesAccountType(uid))) {
            return { error: null };
          }
          // Conta legada existe mas pertence ao OUTRO app. Encerra a sessão e
          // orienta o usuário a se cadastrar (com o mesmo e-mail) neste app.
          await supabase.auth.signOut();
          return {
            error: new Error(
              type === "pro"
                ? "Este e-mail está cadastrado como Torcedor. Crie uma conta Profissional usando o mesmo e-mail."
                : "Este e-mail está cadastrado como Profissional. Crie uma conta Torcedor usando o mesmo e-mail."
            ),
          };
        }
      }

      if (error && isNetworkError(error)) {
        await new Promise((r) => setTimeout(r, 600));
        ({ error } = await attempt(internalEmail));
      }
      if (error && isNetworkError(error)) {
        return {
          error: new Error(
            "Sem conexão com o servidor. Verifique sua internet e tente novamente."
          ),
        };
      }
      return { error: error as Error | null };
    } catch (e) {
      if (isNetworkError(e)) {
        // Retry once on raw thrown TypeError
        try {
          await new Promise((r) => setTimeout(r, 600));
          const { error } = await attempt(internalEmail);
          if (error && isNetworkError(error)) {
            return {
              error: new Error(
                "Sem conexão com o servidor. Verifique sua internet e tente novamente."
              ),
            };
          }
          return { error: error as Error | null };
        } catch (e2) {
          return {
            error: new Error(
              "Sem conexão com o servidor. Verifique sua internet e tente novamente."
            ),
          };
        }
      }
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    // Clear user-scoped video progress from localStorage before signing out
    if (user?.id) {
      clearUserVideoProgress(user.id);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };


  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        signUp,
        signIn,
        signOut,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
