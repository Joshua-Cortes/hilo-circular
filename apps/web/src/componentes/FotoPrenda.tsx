import { Baby, BedDouble, Footprints, GraduationCap, type LucideIcon, Shirt, ShoppingBag } from "lucide-react";
import type { SVGProps } from "react";
import { cn } from "../lib/cn";

/** Siluetas que lucide no trae, dibujadas con el mismo trazo para que convivan con sus íconos. */
const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const Pantalon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo} {...props}>
    <path d="M7 3h10l1.2 18h-4.4L12 10l-1.8 11H5.8z" />
    <path d="M7 6h10" />
  </svg>
);

const Vestido = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo} {...props}>
    <path d="M9 3l1 4-5 14h14L14 7l1-4" />
    <path d="M9 3c1 1.3 5 1.3 6 0M10 7h4" />
  </svg>
);

const Chaqueta = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...trazo} {...props}>
    <path d="M8 3l4 3 4-3 4 3-2 5v10H6V11L4 6z" />
    <path d="M12 6v15M9.5 14h.01M14.5 14h.01" />
  </svg>
);

const SILUETA: Record<string, LucideIcon | typeof Pantalon> = {
  polera_camisa: Shirt,
  pantalon: Pantalon,
  falda_vestido: Vestido,
  chaqueta_abrigo: Chaqueta,
  sweater: Shirt,
  ropa_infantil: Baby,
  uniforme_escolar: GraduationCap,
  ropa_de_cama: BedDouble,
  calzado: Footprints,
  bolso_cartera: ShoppingBag,
};

const TONOS = [
  "bg-menta text-hoja-oscura",
  "bg-kraft-clara text-kraft-tinta",
  "bg-menta-clara text-hoja-oscura",
  "bg-kraft text-tinta",
];

type Props = { foto: string | null; prenda: string; titulo: string; className?: string; grande?: boolean };

/** Foto de la prenda o, si no subieron una, una ilustración con el color del tipo de prenda. */
export function FotoPrenda({ foto, prenda, titulo, className, grande = false }: Props) {
  if (foto) {
    return <img src={foto} alt={titulo} loading="lazy" className={cn("size-full object-cover", className)} />;
  }
  const Silueta = SILUETA[prenda] ?? Shirt;
  const indice = Math.max(0, Object.keys(SILUETA).indexOf(prenda)) % TONOS.length;
  return (
    <div className={cn("flex size-full items-center justify-center", TONOS[indice], className)}>
      <Silueta className={grande ? "size-28" : "size-16"} aria-hidden="true" />
      <span className="sr-only">Sin foto</span>
    </div>
  );
}
