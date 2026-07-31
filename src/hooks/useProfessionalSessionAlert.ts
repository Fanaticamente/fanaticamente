import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { IS_PREVIEW_FRAME } from "@/lib/previewMode";

export interface ActiveSessionAppointment {
  id: string;
  user_id: string;
  professional_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  consultation_link: string | null;
  patient: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    birth_date: string | null;
    city: string | null;
  } | null;
}

const ACTIVE_STATUSES = ["confirmed", "link_sent", "in_progress"];
const LEAD_MINUTES = 10;
const WINDOW_HOURS = 3;

export const useProfessionalSessionAlert = () => {
  const { user, roles, loading } = useAuth();
  const location = useLocation();
  const [appointment, setAppointment] = useState<ActiveSessionAppointment | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  const isProfessional = !!roles?.includes("professional");
  const isManagerRoute =
    location.pathname.startsWith("/developer") ||
    location.pathname.startsWith("/desenvolvedor") ||
    location.pathname.startsWith("/admin");

  const clear = useCallback((id?: string) => {
    if (id) dismissedRef.current.add(id);
    setAppointment(null);
  }, []);

  useEffect(() => {
    if (loading || !user || !isProfessional || isManagerRoute || IS_PREVIEW_FRAME) return;

    let cancelled = false;

    const check = async () => {
      try {
        const { data: professional } = await supabase
          .from("professionals")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!professional || cancelled) return;

        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const yesterday = new Date(now.getTime() - 24 * 3600 * 1000).toISOString().slice(0, 10);

        const { data: rows } = await supabase
          .from("appointments")
          .select("id, user_id, professional_id, scheduled_date, scheduled_time, status, consultation_link")
          .eq("professional_id", professional.id)
          .in("status", ACTIVE_STATUSES)
          .gte("scheduled_date", yesterday)
          .lte("scheduled_date", todayStr)
          .order("scheduled_date", { ascending: true });

        if (cancelled || !rows?.length) return;

        const match = rows.find((r) => {
          const start = new Date(`${r.scheduled_date}T${r.scheduled_time}`);
          const openAt = new Date(start.getTime() - LEAD_MINUTES * 60 * 1000);
          const closeAt = new Date(start.getTime() + WINDOW_HOURS * 3600 * 1000);
          return now >= openAt && now <= closeAt && !dismissedRef.current.has(r.id);
        });

        if (!match) return;

        const { data: patient } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, phone, birth_date, city")
          .eq("user_id", match.user_id)
          .maybeSingle();

        if (cancelled) return;
        setAppointment((prev) => (prev?.id === match.id ? prev : { ...match, patient: patient ?? null }));
      } catch (err) {
        console.warn("[ProfessionalSessionAlert] check failed", err);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?.id, loading, isProfessional, isManagerRoute]);

  return { sessionAlert: appointment, clearSessionAlert: clear };
};
