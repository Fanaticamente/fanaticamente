import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { clearUserVideoProgress } from "@/hooks/useVideoProgress";


type AppRole = "user" | "professional" | "developer" | "admin";

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
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data) {
      setRoles(data.map((r) => r.role as AppRole));
    }
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
      const { crp, document_type, document_number, ...profileFields } = profileData;

      // Clear sensitive data from storage as soon as we've read it
      const clearStorage = () => {
        sessionStorage.removeItem("pendingProfileUpdate");
        localStorage.removeItem("pendingProfileUpdate");
      };

      if (crp) {
        console.log("[Auth] Professional signup detected");
        
        const success = await completeProfessionalSignup(userId, crp, profileFields, document_type, document_number);
        
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setRolesLoading(true);
          setTimeout(() => {
            (async () => {
              try {
                await fetchUserRoles(session.user.id);
                // Check for pending profile updates
                await updatePendingProfileData(session.user.id);
              } finally {
                setRolesLoading(false);
              }
            })();
          }, 0);
        } else {
          setRoles([]);
          setRolesLoading(false);
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
