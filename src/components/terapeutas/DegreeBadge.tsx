import React from "react";

interface DegreeBadgeProps {
  degree: string;
  className?: string;
}

type DegreeLevel = "gold" | "silver" | null;

const getDegreeLevel = (degree: string): DegreeLevel => {
  const normalized = (degree || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (normalized.includes("doutor")) return "gold";
  if (normalized.includes("mestre")) return "silver";
  return null;
};

const DegreeBadge: React.FC<DegreeBadgeProps> = ({ degree, className = "" }) => {
  const level = getDegreeLevel(degree);
  if (!level) return null;

  const isGold = level === "gold";

  const gradient = isGold
    ? "linear-gradient(135deg, #bf953f 0%, #fcf6ba 20%, #b38728 40%, #fbf5b7 60%, #aa771c 80%, #bf953f 100%)"
    : "linear-gradient(135deg, #a0a0a0 0%, #e0e0e0 20%, #ffffff 40%, #d0d0d0 60%, #f5f5f5 80%, #808080 100%)";

  const shadow = isGold
    ? "inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(139,69,19,0.4), 0 1px 2px rgba(0,0,0,0.2)"
    : "inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(128,128,128,0.4), 0 1px 2px rgba(0,0,0,0.2)";

  const textColor = isGold ? "#5c4005" : "#3a3a3a";
  const borderColor = isGold ? "#B8860B" : "#808080";

  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        background: gradient,
        boxShadow: shadow,
        border: `1px solid ${borderColor}`,
      }}
      aria-label={isGold ? "Doutor(a)" : "Mestre(a)"}
      title={isGold ? "Doutor(a)" : "Mestre(a)"}
    >
      <span
        className="text-[10px] font-bold leading-none"
        style={{
          color: textColor,
          textShadow: "0 1px 0 rgba(255,255,255,0.4)",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        Ψ
      </span>
    </div>
  );
};

export default DegreeBadge;
