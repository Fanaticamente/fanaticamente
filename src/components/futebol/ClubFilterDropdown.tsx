import { useState, useRef, useEffect } from "react";
import { brazilianClubs, BrazilianClub } from "@/data/brazilianClubs";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import fanaticaLogoIcon from "@/assets/fanatica-logo-icon.png";

interface ClubFilterDropdownProps {
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
  accentColor?: string | null;
}

const ClubFilterDropdown = ({ selectedClub, onSelectClub, accentColor }: ClubFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const ClubBadge = ({ club, size = "sm" }: { club: BrazilianClub; size?: "sm" | "md" }) => (
    <div className={cn(
      "rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200",
      size === "sm" ? "w-8 h-8" : "w-10 h-10"
    )}>
      <span className="text-[9px] font-bold text-gray-700 text-center leading-tight px-0.5">
        {club.shortName || club.name.slice(0, 3).toUpperCase()}
      </span>
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
          !selectedClub && "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
        )}
        style={selectedClub && accentColor ? {
          borderColor: accentColor,
          backgroundColor: `${accentColor}0D`,
          color: accentColor,
        } : undefined}
      >
        {selectedClubData ? (
          <>
            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src={selectedClubData.badgeUrl}
                alt={selectedClubData.name}
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="text-sm font-medium" style={{ color: accentColor || undefined }}>{selectedClubData.shortName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectClub(null);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-gray-200"
              style={{ color: accentColor || undefined }}
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm">Filtrar</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header with "All" option */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => handleSelectClub(null)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                !selectedClub ? "bg-primary/10 text-primary" : "hover:bg-gray-50"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                <img src={fanaticaLogoIcon} alt="Todos" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-medium">Todos os clubes</span>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Série A */}
            <div className="p-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Série A
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {serieAClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelectClub(club.id)}
                    title={club.name}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-lg transition-all",
                      selectedClub === club.id 
                        ? "bg-primary/10 ring-2 ring-primary" 
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
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Série B
              </h4>
              <div className="grid grid-cols-5 gap-2">
                {serieBClubs.map((club) => (
                  <button
                    key={club.id}
                    onClick={() => handleSelectClub(club.id)}
                    title={club.name}
                    className={cn(
                      "flex items-center justify-center p-1 rounded-lg transition-all",
                      selectedClub === club.id 
                        ? "bg-primary/10 ring-2 ring-primary" 
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
