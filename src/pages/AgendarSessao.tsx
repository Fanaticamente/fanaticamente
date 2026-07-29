import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BookingDrawer from "@/components/terapeutas/BookingDrawer";
import BottomNav from "@/components/layout/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { getClubById } from "@/data/brazilianClubs";
import { clubNicknames } from "@/data/clubNicknames";

interface TherapistData {
  id: string;
  name: string;
  crp: string;
  degree: string;
  experience: number;
  location: string;
  specialties: string[];
  verified: boolean;
  imageUrl?: string;
  hourlyRate?: number;
  bio?: string;
  socioConsciente?: boolean;
}

const AgendarSessao = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const initial = (location.state ?? {}) as {
    therapist?: TherapistData;
    clubId?: string;
    clubColor?: string;
    clubName?: string;
    clubNickname?: string;
  };
  const [therapist, setTherapist] = useState<TherapistData | null>(initial.therapist ?? null);
  const [clubColor, setClubColor] = useState<string>(initial.clubColor ?? "#10b981");
  const [clubName, setClubName] = useState<string | undefined>(initial.clubName);
  const [clubNickname, setClubNickname] = useState<string | undefined>(initial.clubNickname);
  const [clubId, setClubId] = useState<string | undefined>(initial.clubId);
  const [loading, setLoading] = useState(!initial.therapist);

  useEffect(() => {
    if (!id) return;
    // If we already have data from navigation state, skip the loader entirely
    // and let the fetch below refresh silently in the background.
    (async () => {
      const { data } = await supabase
        .from("professionals_public")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        setTherapist({
          id: data.id!,
          name: data.full_name || "Profissional",
          crp: data.crp || "--",
          degree: data.degree || "Psicólogo(a)",
          experience: data.experience_years || 0,
          location: data.location || "Brasil",
          specialties: data.specialties || [],
          verified: data.is_verified || false,
          imageUrl: data.avatar_url || undefined,
          hourlyRate: data.hourly_rate || undefined,
          bio: data.bio || undefined,
          socioConsciente: data.socio_consciente || false,
        });
        if (data.favorite_club_id) {
          const club = getClubById(data.favorite_club_id);
          if (club) {
            setClubColor(club.primaryColor);
            setClubName(club.name);
            setClubNickname(clubNicknames[club.id]);
            setClubId(club.id);
          }
        }
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <p className="text-gray-600">Profissional não encontrado.</p>
      </div>
    );
  }

  return (
    <>
      <BookingDrawer
        therapist={therapist}
        clubColor={clubColor}
        clubName={clubName}
        clubNickname={clubNickname}
        open
        onOpenChange={(o) => {
          if (!o) {
            if (clubId) navigate("/terapeutas", { state: { clubId } });
            else navigate("/terapeutas", { replace: true });
          }
        }}
        asPage
      />
      <BottomNav />
    </>
  );
};

export default AgendarSessao;