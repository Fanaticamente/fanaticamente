import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearUserVideoProgress } from "@/hooks/useVideoProgress";


type AppRole = "user" | "professional" | "developer" | "admin" | "marketing";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
        setRoles(data.map((r) => r.role as AppRole));
        return true;
      }
      lastError = error;
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    console.error("[Auth] Failed to fetch user roles after retries:", lastError);
    return false;
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

        if (session?.user) {
          setRolesLoading(true);
          setRoles([]);
          setTimeout(() => {
            (async () => {
              try {
                await fetchUserRoles(session.user.id);
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setRolesLoading(true);
        try {
          await fetchUserRoles(session.user.id);
          // Register with OneSignal on session restore
          setTimeout(() => registerOneSignalUser(session.user.id), 2000);
        } finally {
          setRolesLoading(false);
        }
      } else {
        setRolesLoading(false);
      }

      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
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
