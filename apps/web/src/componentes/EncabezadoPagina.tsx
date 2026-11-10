import type { ReactNode } from "react";

type Props = {
  etiqueta: string;
  /** Se puede marcar una palabra con <em className="acento"> para el destacado de la marca. */
  titulo: ReactNode;
  children?: ReactNode;
  id?: string;
  /** Acciones a la derecha (por ejemplo, "Publicar prenda"). */
  acciones?: ReactNode;
};

export function EncabezadoPagina({ etiqueta, titulo, children, id, acciones }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <p className="etiqueta text-hoja-oscura">{etiqueta}</p>
        <h1 id={id} className="mt-3 text-4xl md:text-6xl">
          {titulo}
        </h1>
        {children && <div className="mt-4 text-xl text-tinta-suave">{children}</div>}
      </div>
      {acciones && <div className="flex flex-wrap gap-3">{acciones}</div>}
    </div>
  );
}
