import { Fragment, ReactNode } from "react";

/**
 * Inline formatting for news body text typed in the manager.
 * Supported markers: **negrito**, *itálico*, __sublinhado__
 */

const PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*)/g;

export const renderInlineFormat = (text: string): ReactNode[] => {
  const parts = (text || "").split(PATTERN).filter((p) => p !== "");

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
      return <u key={idx}>{part.slice(2, -2)}</u>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={idx}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={idx}>{part}</Fragment>;
  });
};

/** Same formatting, but producing HTML (for sanitized HTML renderers). */
export const inlineFormatToHtml = (text: string): string =>
  (text || "")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<u>$1</u>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
