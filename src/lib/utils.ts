import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstAndLastName(fullName: string): string {
  const names = fullName.trim().split(/\s+/);
  if (names.length <= 2) return fullName;
  return `${names[0]} ${names[names.length - 1]}`;
}

export function formatTimeAgo(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: ptBR,
  })
    .replace(/^cerca de /, "há ")
    .replace(/cerca de /g, "");
}

