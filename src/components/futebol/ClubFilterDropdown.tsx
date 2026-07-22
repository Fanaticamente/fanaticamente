import { useState, useRef, useEffect } from "react";
import { brazilianClubs, BrazilianClub } from "@/data/brazilianClubs";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import fanaticaLogoIcon from "@/assets/fanatica-logo-icon.png";
import { useModuleConfig } from "@/hooks/useModuleConfig";
import ClubMark, { ClubDisplayMode } from "@/components/clubs/ClubMark";

interface ClubFilterDropdownProps {
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
  accentColor?: string | null;
}

const ClubFilterDropdown = ({ selectedClub, onSelectClub, accentColor }: ClubFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: moduleConfig } = useModuleConfig("football_page");
  const showBadges = (moduleConfig?.config as Record<string, unknown> | undefined)?.show_badges !== false;
  const hiddenBadges = (((moduleConfig?.config as Record<string, unknown> | undefined)?.hidden_badges) as string[] | undefined) || [];
  const clubDisplayMode = (((moduleConfig?.config as Record<string, unknown> | undefined)?.club_display_mode) as ClubDisplayMode) || "badge";

  const serieAClubs = brazilianClubs.filter((club) => club.league === "serie_a");
  const serieBClubs = brazilianClubs.filter((club) => club.league === "serie_b");

  const selectedClubData = selectedClub 
    ? brazilianClubs.find((c) => c.id === selectedClub) 
    : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClub = (clubId: string | null) => {
    onSelectClub(clubId);
    setIsOpen(false);
  };

  const ClubBadge = ({ club, size = "sm" }: { club: BrazilianClub; size?: "sm" | "md" }) => {
    const dimensions = size === "sm" ? "w-8 h-8" : "w-10 h-10";
    const showBadgeImage = showBadges && !hiddenBadges.includes(club.id);
    return (
      <div className={cn(
        "rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200",
        dimensions
      )}>
        {showBadgeImage ? (
          <div className="w-full h-full flex items-center justify-center p-0.5">
            <ClubMark clubId={club.id} mode={clubDisplayMode} />
          </div>
        ) : (
          <span className="text-[9px] font-bold text-gray-700 text-center leading-tight px-0.5">
            {club.shortName || club.name.slice(0, 3).toUpperCase()}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors"
        style={
          selectedClub && accentColor
            ? { backgroundColor: accentColor, color: "#fff" }
            : { backgroundColor: "#f3f4f6", color: "#374151" }
        }
      >
        {selectedClubData ? (
          <>
            <span>{selectedClubData.shortName || selectedClubData.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectClub(null);
              }}
              className="ml-0.5 p-0.5 rounded-full hover:bg-white/20"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </>
        ) : (
          <>
            <span>Filtrar</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[300px] bg-white rounded-2xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header with "All" option */}
          <div className="p-2 border-b border-gray-100">
            <button
              onClick={() => handleSelectClub(null)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-colors text-sm",
                !selectedClub ? "bg-gray-100 text-gray-900 font-semibold" : "hover:bg-gray-50 text-gray-700"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                <img src={fanaticaLogoIcon} alt="Todos" className="w-5 h-5 object-contain" />
              </div>
              <span>Todos os clubes</span>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Série A */}
            <div className="p-3">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Série A
              </h4>
              <div className="grid grid-cols-6 gap-1.5">
                {serieAClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelectClub(club.id)}
                    title={club.name}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-lg transition-all",
                      selectedClub === club.id 
                        ? "bg-gray-100 ring-2 ring-gray-900" 
                        : "hover:bg-gray-100"
                    )}
                  >
                    <ClubBadge club={club} />
                  </button>
                ))}
              </div>
            </div>

            {/* Série B */}
            <div className="p-3 border-t border-gray-100">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Série B
              </h4>
              <div className="grid grid-cols-6 gap-1.5">
                {serieBClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelectClub(club.id)}
                    title={club.name}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-lg transition-all",
                      selectedClub === club.id 
                        ? "bg-gray-100 ring-2 ring-gray-900" 
                        : "hover:bg-gray-100"
                    )}
                  >
                    <ClubBadge club={club} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubFilterDropdown;
