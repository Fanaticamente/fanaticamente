import { brazilianClubs } from "@/data/brazilianClubs";
import { cn } from "@/lib/utils";
import ClubFlag from "./ClubFlag";

export type ClubDisplayMode = "badge" | "flag";

interface ClubMarkProps {
  clubId: string;
  mode?: ClubDisplayMode;
  className?: string;
  imgClassName?: string;
}

/**
 * Unified renderer for a club identity element.
 * - mode="badge": original shield image
 * - mode="flag" : generated unique color flag
 */
const ClubMark = ({ clubId, mode = "badge", className, imgClassName }: ClubMarkProps) => {
  const club = brazilianClubs.find((c) => c.id === clubId);
  if (!club) return null;

  if (mode === "flag") {
    return <ClubFlag clubId={clubId} className={cn("w-full h-full", className)} />;
  }

  return (
    <img
      src={club.badgeUrl}
      alt={club.name}
      className={cn("w-full h-full object-contain", imgClassName, className)}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
};

export default ClubMark;