import { brazilianClubs } from "@/data/brazilianClubs";
import { getClubColorBands } from "@/data/clubColorBands";
import { cn } from "@/lib/utils";

const ClubColorCircle = ({ clubId, className }: { clubId: string; className?: string }) => {
  const club = brazilianClubs.find((item) => item.id === clubId);
  if (!club) return null;
  const bands = getClubColorBands(club);
  // A clipped vector fills the entire existing circle without image loading delays.
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={`Cores do ${club.name}`}
      className={cn("block w-full h-full rounded-full overflow-hidden", className)}>
      {bands.map((color, index) => (
        <rect key={index} x={index * 100 / bands.length} y="0"
          width={100 / bands.length + 0.1} height="100" fill={color} />
      ))}
    </svg>
  );
};

export default ClubColorCircle;