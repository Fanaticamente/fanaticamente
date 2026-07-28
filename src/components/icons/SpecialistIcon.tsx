import icEspecialista from "@/assets/Untitled_design-23.png.asset.json";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Ícone oficial de "Terapeutas / Especialistas" usado em todos os menus do app. */
export const SpecialistIcon = ({ className, size }: Props) => (
  <img
    src={icEspecialista.url}
    alt=""
    aria-hidden="true"
    style={size ? { width: size, height: size } : undefined}
    className={cn("object-contain shrink-0", className)}
  />
);

export default SpecialistIcon;
