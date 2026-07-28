import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Ícone oficial de "Terapeutas / Especialistas" usado em todos os menus do app.
 *  Desenhado como SVG para herdar tamanho e cor (currentColor) dos demais ícones. */
export const SpecialistIcon = ({ className, size, strokeWidth = 2 }: Props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={size ?? 24}
    height={size ?? 24}
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={cn("shrink-0", className)}
  >
    {/* estrelas (torcida) */}
    <path d="M12 1.6l.62 1.3 1.38.2-1 1 .24 1.4L12 4.84l-1.24.66.24-1.4-1-1 1.38-.2z" />
    <path d="M5.6 4.2l.5 1.05 1.1.16-.8.79.19 1.12-1-.53-.99.53.19-1.12-.8-.79 1.11-.16z" />
    <path d="M18.4 4.2l.5 1.05 1.1.16-.8.79.19 1.12-1-.53-.99.53.19-1.12-.8-.79 1.11-.16z" />
    {/* pessoa */}
    <circle cx="12" cy="11.5" r="2.6" />
    <path d="M6.5 22v-1.2A4.3 4.3 0 0 1 10.8 16.5h2.4a4.3 4.3 0 0 1 4.3 4.3V22" />
  </svg>
);

export default SpecialistIcon;
