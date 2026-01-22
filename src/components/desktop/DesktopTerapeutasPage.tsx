import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Star, ChevronDown, Users, Clock, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getClubsByLeague, BrazilianClub } from "@/data/brazilianClubs";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import DesktopHeader from "./DesktopHeader";

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
  clubId?: string;
  clubName?: string;
  clubColor?: string;
  clubBadge?: string;
}

type League = "serie_a" | "serie_b" | "serie_c";

const leagueLabels: Record<League, string> = {
  serie_a: "Série A",
  serie_b: "Série B",
  serie_c: "Série C",
};

const DesktopTerapeutasPage = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<League>("serie_a");
  const [selectedClub, setSelectedClub] = useState<BrazilianClub | null>(null);
  const [therapists, setTherapists] = useState<TherapistData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const clubs = getClubsByLeague(selectedLeague);

  const fetchTherapistsForClub = async (club: BrazilianClub) => {
    setLoading(true);
    try {
      const { data: professionals, error } = await supabase
        .from('professionals_public')
        .select('*')
        .eq('approval_status', 'approved');

      if (error || !professionals || professionals.length === 0) {
        setTherapists([]);
        return;
      }

      const userIds = professionals.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, favorite_club_id')
        .in('user_id', userIds)
        .eq('favorite_club_id', club.id);

      if (profilesError) {
        setTherapists([]);
        return;
      }

      const therapistData: TherapistData[] = [];
      
      for (const profile of (profiles || [])) {
        const professional = professionals.find(p => p.user_id === profile.user_id);
        if (professional) {
          therapistData.push({
            id: professional.id!,
            name: profile.full_name || 'Profissional',
            crp: professional.crp!,
            degree: professional.degree || 'Psicólogo(a)',
            experience: professional.experience_years || 0,
            location: professional.location || 'Brasil',
            specialties: professional.specialties || [],
            verified: professional.is_verified || false,
            imageUrl: profile.avatar_url || undefined,
            hourlyRate: professional.hourly_rate || undefined,
            bio: professional.bio || undefined,
            clubId: club.id,
            clubName: club.name,
            clubColor: club.primaryColor,
            clubBadge: club.badgeUrl,
          });
        }
      }

      setTherapists(therapistData);
    } catch (err) {
      console.error('Erro:', err);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (club: BrazilianClub) => {
    setSelectedClub(club);
    fetchTherapistsForClub(club);
  };

  const handleTherapistClick = (therapistId: string) => {
    // Perfil público do especialista (rota pública)
    navigate(`/terapeuta/${therapistId}`);
  };

  const filteredTherapists = therapists.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header for Light Theme */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-12">
            <a href="/" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              Início
            </a>
            <a href="/terapeutas" className="text-emerald-600 font-semibold border-b-2 border-emerald-600 pb-1">
              Especialistas
            </a>
            <a href="/psi-house" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              OSMF
            </a>
            <a href="/#profissionais" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">
              Junte-se a nós
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="/auth">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                Entrar
              </Button>
            </a>
            <a href="/auth">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                Baixar App
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Encontre seu <span className="text-emerald-600">Especialista</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Psicólogos que entendem a paixão pelo futebol e cuidam da sua saúde mental
            </p>

            {/* Search Bar */}
            <div className="flex gap-4 max-w-2xl mx-auto mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou especialidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg bg-white border-gray-200 rounded-xl shadow-sm"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-14 px-6 rounded-xl border-gray-200"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtros
              </Button>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12 text-center">
              <div>
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <Users className="w-5 h-5" />
                  <span className="text-2xl font-bold">50+</span>
                </div>
                <p className="text-sm text-gray-500">Profissionais</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <Clock className="w-5 h-5" />
                  <span className="text-2xl font-bold">24h</span>
                </div>
                <p className="text-sm text-gray-500">Disponibilidade</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                  <Shield className="w-5 h-5" />
                  <span className="text-2xl font-bold">100%</span>
                </div>
                <p className="text-sm text-gray-500">Verificados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Club Selection */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Selecione seu time
              </h2>

              {/* League Tabs */}
              <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
                {(Object.keys(leagueLabels) as League[]).map((league) => (
                  <button
                    key={league}
                    onClick={() => {
                      setSelectedLeague(league);
                      setSelectedClub(null);
                      setTherapists([]);
                    }}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                      selectedLeague === league
                        ? "bg-white text-emerald-600 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {leagueLabels[league]}
                  </button>
                ))}
              </div>

              {/* Clubs Grid */}
              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleClubSelect(club)}
                    className={`p-2 rounded-xl transition-all flex flex-col items-center ${
                      selectedClub?.id === club.id
                        ? "bg-emerald-50 ring-2 ring-emerald-500"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white p-1 shadow-sm flex items-center justify-center mb-1">
                      <img
                        src={club.badgeUrl}
                        alt={club.name}
                        className="w-7 h-7 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://via.placeholder.com/40?text=${club.shortName}`;
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2">
                      {club.shortName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Therapists Grid */}
          <section className="lg:col-span-3">
            {!selectedClub ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Selecione um time
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Escolha seu clube do coração na barra lateral para ver os especialistas disponíveis para a sua torcida.
                </p>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTherapists.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nenhum especialista encontrado
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Em breve teremos profissionais disponíveis para a torcida do {selectedClub.name}.
                </p>
              </div>
            ) : (
              <>
                {/* Selected Club Header */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-100">
                  <div 
                    className="w-14 h-14 rounded-full p-2 flex items-center justify-center"
                    style={{ backgroundColor: `${selectedClub.primaryColor}15` }}
                  >
                    <img
                      src={selectedClub.badgeUrl}
                      alt={selectedClub.name}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedClub.name}</h2>
                    <p className="text-gray-500">{filteredTherapists.length} especialista(s) disponível(is)</p>
                  </div>
                </div>

                {/* Therapist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredTherapists.map((therapist) => (
                    <div
                      key={therapist.id}
                      onClick={() => handleTherapistClick(therapist.id)}
                      className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="relative">
                          <div 
                            className="w-20 h-20 rounded-full overflow-hidden border-4"
                            style={{ borderColor: `${selectedClub.primaryColor}30` }}
                          >
                            {therapist.imageUrl ? (
                              <img
                                src={therapist.imageUrl}
                                alt={therapist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                                style={{ backgroundColor: selectedClub.primaryColor }}
                              >
                                {therapist.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          {therapist.verified && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Shield className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                            {therapist.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{therapist.degree}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{therapist.location}</span>
                            <span className="text-gray-300">•</span>
                            <span>{therapist.experience} anos exp.</span>
                          </div>

                          {/* Specialties */}
                          <div className="flex flex-wrap gap-2">
                            {therapist.specialties.slice(0, 3).map((specialty, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-gray-100 text-gray-600 text-xs"
                              >
                                {specialty}
                              </Badge>
                            ))}
                            {therapist.specialties.length > 3 && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-xs">
                                +{therapist.specialties.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        {therapist.hourlyRate && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              R${therapist.hourlyRate}
                            </p>
                            <p className="text-xs text-gray-400">por sessão</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 Fanaticamente. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DesktopTerapeutasPage;
