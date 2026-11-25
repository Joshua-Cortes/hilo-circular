import { Check } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type PropsChipFiltro = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> & {
  activo: boolean;
  children: ReactNode;
};

/**
 * Chip de filtro accesible adaptado a los tokens de estilos.css (docs/06-sistema-de-diseno.md).
 * Cumple altura táctil mínima de 48 px (min-h-12) y comunica el estado con aria-pressed + ícono.
 */
export function ChipFiltro({ activo, className, children, ...resto }: PropsChipFiltro) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cn(
        "inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-base font-bold transition-colors duration-200 ease-hilo",
        activo
          ? "border-tinta bg-tinta text-fondo"
          : "border-borde bg-superficie text-tinta hover:border-hoja hover:bg-menta-clara",
        className,
      )}
      {...resto}
    >
      {activo && <Check className="size-4 shrink-0" aria-hidden="true" />}
      <span className="inline-flex items-center gap-1.5">{children}</span>
    </button>
  );
}
