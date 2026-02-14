import { useState } from "react";
import { ChevronDown, ChevronRight, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { brazilianClubs } from "@/data/brazilianClubs";

interface ClubBadgeTogglesProps {
  showBadges: boolean;
  onShowBadgesChange: (val: boolean) => void;
  hiddenBadges: string[];
  onHiddenBadgesChange: (badges: string[]) => void;
}

const leagueLabels: Record<string, string> = {
  serie_a: "Série A",
  serie_b: "Série B",
  serie_c: "Série C",
};

const ClubBadgeToggles = ({
  showBadges,
  onShowBadgesChange,
  hiddenBadges,
  onHiddenBadgesChange,
}: ClubBadgeTogglesProps) => {
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

  const toggleClub = (clubId: string) => {
    if (hiddenBadges.includes(clubId)) {
      onHiddenBadgesChange(hiddenBadges.filter((id) => id !== clubId));
    } else {
      onHiddenBadgesChange([...hiddenBadges, clubId]);
    }
  };

  const leagues = ["serie_a", "serie_b", "serie_c"] as const;

  return (
    <div className="space-y-3">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Exibir escudos dos clubes</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mostra os escudos junto aos nomes dos clubes
          </p>
        </div>
        <Switch
          checked={showBadges}
          onCheckedChange={onShowBadgesChange}
        />
      </div>

      {/* Per-club toggles */}
      {showBadges && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Visibilidade individual por clube
            </span>
          </div>

          {leagues.map((league) => {
            const clubs = brazilianClubs.filter((c) => c.league === league);
            const isExpanded = expandedLeague === league;
            const hiddenCount = clubs.filter((c) => hiddenBadges.includes(c.id)).length;

            return (
              <div key={league} className="border-t border-border">
                <button
                  onClick={() => setExpandedLeague(isExpanded ? null : league)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium text-card-foreground flex-1 text-left">
                    {leagueLabels[league]}
                  </span>
                  {hiddenCount > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {hiddenCount} oculto{hiddenCount > 1 ? "s" : ""}
                    </span>
                  )}
                </button>

                {isExpanded && (
                  <div className="px-2 pb-2 space-y-0.5">
                    {clubs.map((club) => {
                      const isHidden = hiddenBadges.includes(club.id);
                      return (
                        <div
                          key={club.id}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors"
                        >
                          <img
                            src={club.badgeUrl}
                            alt={club.name}
                            className="w-6 h-6 object-contain flex-shrink-0"
                          />
                          <span className={`text-xs flex-1 truncate ${isHidden ? "text-muted-foreground line-through" : "text-card-foreground"}`}>
                            {club.name}
                          </span>
                          <Switch
                            checked={!isHidden}
                            onCheckedChange={() => toggleClub(club.id)}
                            className="scale-75"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClubBadgeToggles;
