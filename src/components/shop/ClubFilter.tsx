import { brazilianClubs } from "@/data/brazilianClubs";
import { cn } from "@/lib/utils";
import fanaticaLogoIcon from "@/assets/fanatica-logo-icon.png";

interface ClubFilterProps {
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

const ClubFilter = ({ selectedClub, onSelectClub }: ClubFilterProps) => {
  const serieAClubs = brazilianClubs.filter((club) => club.league === "serie_a");

  return (
    <div className="bg-zinc-900 border-b border-zinc-800">
      <div
        className={cn(
          "h-[72px] w-full overflow-x-auto overflow-y-hidden",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        <div className="flex gap-3 px-4 h-full items-center">
          {/* All clubs option */}
          <button
            onClick={() => onSelectClub(null)}
            className={cn(
              "flex items-center justify-center transition-all flex-shrink-0",
              selectedClub === null ? "scale-105" : "opacity-60 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full p-1.5 flex items-center justify-center overflow-hidden bg-white",
                selectedClub === null &&
                  "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
              )}
            >
              <img
                src={fanaticaLogoIcon}
                alt="Todos os times"
                className="w-10 h-10 object-contain"
              />
            </div>
          </button>

          {serieAClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectClub(club.id)}
              className={cn(
                "flex items-center justify-center transition-all flex-shrink-0",
                selectedClub === club.id
                  ? "scale-105"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full p-1 flex items-center justify-center bg-white overflow-hidden",
                  selectedClub === club.id &&
                    "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                )}
              >
                <img
                  src={club.badgeUrl}
                  alt={club.name}
                  className={club.id === "coritiba" ? "w-10 h-10 object-contain" : "w-9 h-9 object-contain"}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClubFilter;
