import { brazilianClubs } from "@/data/brazilianClubs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ClubFilterProps {
  selectedClub: string | null;
  onSelectClub: (clubId: string | null) => void;
}

const ClubFilter = ({ selectedClub, onSelectClub }: ClubFilterProps) => {
  const serieAClubs = brazilianClubs.filter((club) => club.league === "serie_a");

  return (
    <div className="py-3 sticky top-[57px] z-20 bg-zinc-900 border-b border-zinc-800">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4">
          {/* All clubs option */}
          <button
            onClick={() => onSelectClub(null)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[60px] transition-all flex-shrink-0",
              selectedClub === null ? "scale-105" : "opacity-60 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold",
                selectedClub === null
                  ? "bg-white text-zinc-900 ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                  : "bg-zinc-700 text-zinc-300"
              )}
            >
              TODOS
            </div>
            <span className="text-xs text-zinc-400">Todos</span>
          </button>

          {serieAClubs.map((club) => (
            <button
              key={club.id}
              onClick={() => onSelectClub(club.id)}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[60px] transition-all flex-shrink-0",
                selectedClub === club.id
                  ? "scale-105"
                  : "opacity-60 hover:opacity-100"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full p-1.5 flex items-center justify-center bg-white",
                  selectedClub === club.id &&
                    "ring-2 ring-white ring-offset-2 ring-offset-zinc-900"
                )}
              >
                <img
                  src={club.badgeUrl}
                  alt={club.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-zinc-400 truncate max-w-[60px]">
                {club.shortName}
              </span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default ClubFilter;
