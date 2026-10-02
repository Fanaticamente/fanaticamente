import { useMemo } from "react";
import { useAppContent } from "@/hooks/useAppContent";

export type FanTextStyle = { size?: number; scale?: number; align?: "left" | "center" | "right"; offsetX?: number; offsetY?: number };
export const fanCopyKey = (id: string) => `fan_copy_${id}`;
export const fanStyleKey = (id: string) => `fan_style_${id}`;
export const FAN_TEXT_PREVIEW_KEY = "fan_text_draft_preview";

/** The parent retains its own typography and spacing until a developer saves an override. */
const EditableFanText = ({ id, fallback }: { id: string; fallback: string }) => {
  const { data } = useAppContent("fan_copy");
  const { data: styles } = useAppContent("fan_style");
  const value = data?.find(item => item.key === fanCopyKey(id))?.value;
  const raw = styles?.find(item => item.key === fanStyleKey(id))?.value;
  let preview: { id: string; value: string; style: FanTextStyle } | null = null;
  if (typeof window !== "undefined" && window.location.search.includes("fanTextPreview=1")) {
    try {
      const stored = sessionStorage.getItem(FAN_TEXT_PREVIEW_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed?.id === id && typeof parsed.value === "string") preview = parsed;
    } catch { /* An unavailable preview never affects published text. */ }
  }
  const style = useMemo<FanTextStyle>(() => {
    try { return raw ? JSON.parse(raw) as FanTextStyle : {}; } catch { return {}; }
  }, [raw]);
  const effective = preview?.style ?? style;
  const size = typeof effective.size === "number" && effective.size >= 9 && effective.size <= 48 ? effective.size : undefined;
  const scale = typeof effective.scale === "number" && effective.scale >= 0.5 && effective.scale <= 2 ? effective.scale : undefined;
  const offsetX = Number.isFinite(effective.offsetX) ? Math.max(-24, Math.min(24, effective.offsetX ?? 0)) : 0;
  const offsetY = Number.isFinite(effective.offsetY) ? Math.max(-24, Math.min(24, effective.offsetY ?? 0)) : 0;
  return <span style={{
    fontSize: scale ? `calc(${size ? `${size}px` : "1em"} * ${scale})` : size ? `${size}px` : undefined,
    textAlign: ["left", "center", "right"].includes(effective.align || "") ? effective.align : undefined,
    display: effective.align || offsetX || offsetY ? "inline-block" : undefined,
    width: effective.align ? "100%" : undefined,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    position: offsetX || offsetY ? "relative" : undefined,
    left: offsetX || undefined,
    top: offsetY || undefined,
  }}>{preview?.value ?? value ?? fallback}</span>;
};

export default EditableFanText;
