import type { Horario } from "../db/schema.js";

const ZONA_HORARIA = "America/Santiago";

/** Día (0 = domingo) y hora "HH:MM" en Chile continental para un instante dado. */
export function momentoEnChile(fecha: Date): { dia: number; hora: string } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { dia: dias.indexOf(valor("weekday")), hora: `${valor("hour")}:${valor("minute")}` };
}

export function estaAbierto(horarios: Horario[], fecha = new Date()): boolean {
  const { dia, hora } = momentoEnChile(fecha);
  return horarios.some((h) => h.dia === dia && h.abre <= hora && hora < h.cierra);
}
