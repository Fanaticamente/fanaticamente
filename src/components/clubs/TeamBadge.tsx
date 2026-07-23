import { brazilianClubs } from "@/data/brazilianClubs";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  clubId?: string | null;
  fotmobId?: string | null;
  alt?: string;
  className?: string;
}

/**
 * Renders a team badge preferring the local brazilianClubs entry, falling
 * back to FotMob's public logo CDN when we don't have a local mapping (e.g.
 * lesser-known Série C clubs or international teams in the Libertadores).
 */
const TeamBadge = ({ clubId, fotmobId, alt, className }: TeamBadgeProps) => {
  const local = clubId ? brazilianClubs.find((c) => c.id === clubId) : undefined;
  const src = local?.badgeUrl
    ?? (fotmobId ? `https://images.fotmob.com/image_resources/logo/teamlogo/${fotmobId}.png` : null);
  if (!src) {
    return <div className={cn("w-full h-full rounded-full bg-gray-200", className)} />;
  }
  return (
    <img
      src={src}
      alt={alt ?? local?.name ?? ""}
      className={cn("w-full h-full object-contain", className)}
      onError={(e) => {
        (e.target as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
};

export default TeamBadge;