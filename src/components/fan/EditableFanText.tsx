import { useMemo } from "react";
import { useAppContent } from "@/hooks/useAppContent";

export type FanTextStyle = { size?: number; align?: "left" | "center" | "right"; offsetX?: number; offsetY?: number };
export const fanCopyKey = (id: string) => `fan_copy_${id}`;
export const fanStyleKey = (id: string) => `fan_style_${id}`;

/** The parent retains its own typography and spacing until a developer saves an override. */
const EditableFanText = ({ id, fallback }: { id: string; fallback: string }) => {
  const { data } = useAppContent("fan_copy");
  const { data: styles } = useAppContent("fan_style");
  const value = data?.find(item => item.key === fanCopyKey(id))?.value;
  const raw = styles?.find(item => item.key === fanStyleKey(id))?.value;
  const style = useMemo<FanTextStyle>(() => {
    try { return raw ? JSON.parse(raw) as FanTextStyle : {}; } catch { return {}; }
  }, [raw]);
  const size = typeof style.size === "number" && style.size >= 9 && style.size <= 48 ? style.size : undefined;
  const offsetX = Number.isFinite(style.offsetX) ? Math.max(-24, Math.min(24, style.offsetX ?? 0)) : 0;
  const offsetY = Number.isFinite(style.offsetY) ? Math.max(-24, Math.min(24, style.offsetY ?? 0)) : 0;
  return <span style={{
    fontSize: size ? `${size}px` : undefined,
    textAlign: ["left", "center", "right"].includes(style.align || "") ? style.align : undefined,
    display: style.align || offsetX || offsetY ? "inline-block" : undefined,
    width: style.align ? "100%" : undefined,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    position: offsetX || offsetY ? "relative" : undefined,
    left: offsetX || undefined,
    top: offsetY || undefined,
  }}>{value ?? fallback}</span>;
};

export default EditableFanText;
