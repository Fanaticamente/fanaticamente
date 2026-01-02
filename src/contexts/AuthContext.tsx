import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(true);

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
  const completeProfessionalSignup = async (userId: string, crp: string, profileFields: Record<string, any>) => {
    console.log("[Auth] Calling complete-professional-signup edge function for user:", userId, "CRP:", crp);
    
    const { data, error } = await supabase.functions.invoke("complete-professional-signup", {
      body: {
        crp,
        profile: profileFields,
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
  const updatePendingProfileData = async (userId: string) => {
    const pendingData = localStorage.getItem("pendingProfileUpdate");
    if (!pendingData) {
      console.log("[Auth] No pending profile data found");
      return;
    }

    console.log("[Auth] Processing pending profile data:", pendingData);

    try {
      const profileData = JSON.parse(pendingData);
      const { crp, ...profileFields } = profileData;

      if (crp) {
        console.log("[Auth] Professional signup detected with CRP:", crp);
        
        const success = await completeProfessionalSignup(userId, crp, profileFields);
        
        if (success) {
          localStorage.removeItem("pendingProfileUpdate");
        }
        // Keep pending data on failure so we can retry
        return;
      }

      // Regular user: just update profile fields
      console.log("[Auth] Regular user, updating profile fields:", profileFields);
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileFields)
        .eq("user_id", userId);

      if (!profileError) {
        console.log("[Auth] Profile updated successfully");
        localStorage.removeItem("pendingProfileUpdate");
      } else {
        console.error("[Auth] Profile update failed:", profileError);
      }
    } catch (error) {
      console.error("[Auth] Error updating pending profile data:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
            // Check for pending profile updates
            updatePendingProfileData(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
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
