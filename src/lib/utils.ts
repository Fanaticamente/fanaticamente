import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstAndLastName(fullName: string): string {
  const names = fullName.trim().split(/\s+/);
  if (names.length <= 2) return fullName;
  return `${names[0]} ${names[names.length - 1]}`;
}
