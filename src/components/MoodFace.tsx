import { cn } from "@/lib/utils";

export type MoodVariant = "happy" | "calm" | "meh" | "worried" | "sad";

interface Props {
  variant: MoodVariant;
  className?: string;
  size?: number;
  /** CSS color for the face (stroke + subtle fill). Defaults to currentColor. */
  color?: string;
  /** Override color for the outer ring around the face. */
  ringColor?: string;
  /** Override stroke width for the outer ring. */
  ringWidth?: number;
}

/**
 * Flat, editorial round-face illustration. Single color, varies only by expression.
 * Uses currentColor so it inherits from parent (e.g. text-[var(--club-600)]).
 */
const MoodFace = ({ variant, className, size = 28, color, ringColor, ringWidth }: Props) => {
  const stroke = color ?? "currentColor";
  const sw = 2.2;
  const common = {
    fill: "none",
    stroke,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  // Eyes and mouth per variant
  const parts = (() => {
    switch (variant) {
      case "happy":
        return (
          <>
            <path d="M8.5 13c.6-.9 1.6-1.4 2.6-1.4s2 .5 2.6 1.4" {...common} />
            <path d="M18.3 13c.6-.9 1.6-1.4 2.6-1.4s2 .5 2.6 1.4" {...common} />
            <path d="M9.5 18.5c1.6 2.4 4.4 3.6 6.5 3.6s4.9-1.2 6.5-3.6" {...common} />
          </>
        );
      case "calm":
        return (
          <>
            <circle cx="11" cy="13" r="1.1" fill={stroke} />
            <circle cx="21" cy="13" r="1.1" fill={stroke} />
            <path d="M11 19.5c1.4 1.3 3.3 2 5 2s3.6-.7 5-2" {...common} />
          </>
        );
      case "meh":
        return (
          <>
            <circle cx="11" cy="13" r="1.1" fill={stroke} />
            <circle cx="21" cy="13" r="1.1" fill={stroke} />
            <path d="M11 20h10" {...common} />
          </>
        );
      case "worried":
        return (
          <>
            <path d="M9 12.5c.7-.7 1.6-1 2.4-.9" {...common} />
            <path d="M23 12.5c-.7-.7-1.6-1-2.4-.9" {...common} />
            <circle cx="11" cy="13.6" r="1.1" fill={stroke} />
            <circle cx="21" cy="13.6" r="1.1" fill={stroke} />
            <path d="M11 21c1.5-1.2 3.3-1.8 5-1.8s3.5.6 5 1.8" {...common} />
          </>
        );
      case "sad":
      default:
        return (
          <>
            <path d="M9 12.6c.7-.7 1.6-1 2.4-.9" {...common} />
            <path d="M23 12.6c-.7-.7-1.6-1-2.4-.9" {...common} />
            <circle cx="11" cy="14" r="1.1" fill={stroke} />
            <circle cx="21" cy="14" r="1.1" fill={stroke} />
            <path d="M10.5 21.5c1.6-1.9 3.5-2.9 5.5-2.9s3.9 1 5.5 2.9" {...common} />
          </>
        );
    }
  })();

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        fill={stroke}
        fillOpacity={0.12}
        stroke={ringColor ?? stroke}
        strokeWidth={ringWidth ?? sw}
      />
      {parts}
    </svg>
  );
};

export default MoodFace;