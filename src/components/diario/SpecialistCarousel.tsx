import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getFirstAndLastName } from "@/lib/utils";

interface Specialist {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  degree: string | null;
}

const SpecialistCarousel = () => {
  const navigate = useNavigate();
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("professionals_public")
        .select("id, full_name, avatar_url, degree")
        .eq("approval_status", "approved")
        .not("avatar_url", "is", null)
        .limit(20);
      if (cancelled) return;
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setSpecialists(shuffled as Specialist[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && specialists.length === 0) return null;

  return (
    <div className="mt-5 bg-muted border border-border rounded-2xl p-5">
      <h3 className="text-card-foreground font-bold text-base mb-4 text-center">
        Precisando conversar com um especialista?
      </h3>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2 w-20">
                <div className="w-20 h-20 rounded-full bg-muted-foreground/10 animate-pulse" />
                <div className="h-3 w-16 bg-muted-foreground/10 rounded animate-pulse" />
              </div>
            ))
          : specialists.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/terapeuta/${s.id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-2 w-20 snap-start group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border group-hover:ring-primary transition-all">
                  {s.avatar_url ? (
                    <img
                      src={s.avatar_url}
                      alt={s.full_name || "Profissional"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold">
                      {(s.full_name || "?").charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-card-foreground text-center leading-tight line-clamp-2 capitalize">
                  {getFirstAndLastName(s.full_name || "").toLowerCase()}
                </span>
              </button>
            ))}
      </div>
    </div>
  );
};

export default SpecialistCarousel;