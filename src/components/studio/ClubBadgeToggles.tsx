import { useState } from "react";
import { ChevronDown, ChevronRight, Shield, Flag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { brazilianClubs } from "@/data/brazilianClubs";
import ClubMark, { ClubDisplayMode } from "@/components/clubs/ClubMark";

interface ClubBadgeTogglesProps {
  showBadges: boolean;
  onShowBadgesChange: (val: boolean) => void;
  hiddenBadges: string[];
  onHiddenBadgesChange: (badges: string[]) => void;
  displayMode?: ClubDisplayMode;
  onDisplayModeChange?: (mode: ClubDisplayMode) => void;
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
  displayMode = "badge",
  onDisplayModeChange,
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
          <Label>Exibir identidade dos clubes</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mostra escudo ou bandeirinha junto aos nomes dos clubes
          </p>
        </div>
        <Switch
          checked={showBadges}
          onCheckedChange={onShowBadgesChange}
        />
      </div>

      {/* Display mode selector */}
      {showBadges && onDisplayModeChange && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onDisplayModeChange("badge")}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              displayMode === "badge"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Escudos
          </button>
          <button
            type="button"
            onClick={() => onDisplayModeChange("flag")}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              displayMode === "flag"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            Bandeirinhas
          </button>
        </div>
      )}

      {/* Per-club toggles */}
      {showBadges && (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 flex items-center gap-2">
            {displayMode === "flag" ? (
              <Flag className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            )}
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
                          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                            <ClubMark clubId={club.id} mode={displayMode} />
                          </div>
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
