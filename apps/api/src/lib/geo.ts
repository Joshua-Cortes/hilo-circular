import { type AnyColumn, sql } from "drizzle-orm";

const RADIO_TIERRA_KM = 6371;

/** Distancia en km (fórmula del haversine) entre un punto y las columnas lat/lng de una tabla. */
export function distanciaKm(lat: number, lng: number, colLat: AnyColumn, colLng: AnyColumn) {
  return sql<number>`(${RADIO_TIERRA_KM} * 2 * asin(sqrt(
    power(sin(radians(${colLat} - ${lat}::float8) / 2), 2) +
    cos(radians(${lat}::float8)) * cos(radians(${colLat})) *
    power(sin(radians(${colLng} - ${lng}::float8) / 2), 2)
  )))`;
}

/** Redondea coordenadas a ~1 km para no revelar el domicilio de quien trabaja desde su casa. */
export function difuminar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
