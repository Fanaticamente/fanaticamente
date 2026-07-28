import icEspecialista from "@/assets/Untitled_design-23.png.asset.json";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/**
 * Ícone oficial de "Terapeutas / Especialistas".
 * Renderizado como máscara para herdar a cor atual (tema do clube ou padrão).
 */
export const SpecialistIcon = ({ className, size }: Props) => (
  <span
    aria-hidden="true"
    className={cn("inline-block shrink-0 bg-current align-middle", className)}
    style={{
      width: size,
      height: size,
      WebkitMaskImage: `url(${icEspecialista.url})`,
      maskImage: `url(${icEspecialista.url})`,
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      WebkitMaskPosition: "center",
      maskPosition: "center",
      WebkitMaskSize: "contain",
      maskSize: "contain",
    }}
  />
);

export default SpecialistIcon;
