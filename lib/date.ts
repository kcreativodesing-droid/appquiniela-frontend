// ─────────────────────────────────────────────────────────────────
// Utilidades de fecha — Zona horaria Caracas (America/Caracas)
// Caracas es UTC-4 fijo (sin horario de verano)
// ─────────────────────────────────────────────────────────────────

const TZ = 'America/Caracas';
const LOCALE = 'es-VE';

/**
 * Formatea la hora de un partido en horario de Caracas.
 * Ej: "03:00 PM"  →  "11:00 PM"
 */
export function formatHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}

/**
 * Formatea la fecha de un partido en horario de Caracas.
 * Ej: "11 jun."
 */
export function formatFechaCorta(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    timeZone: TZ,
  });
}

/**
 * Formatea la fecha larga de un partido en horario de Caracas.
 * Ej: "jueves, 11 de junio"
 */
export function formatFechaLarga(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  });
}

/**
 * Retorna el string de fecha local en Caracas para comparar con toDateString().
 * Útil para filtrar "partidos de hoy" según la hora de Caracas.
 */
export function fechaLocalCaracas(fechaIso: string): string {
  // Obtenemos año/mes/día en Caracas y construimos una fecha local equivalente
  const d = new Date(fechaIso);
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d); // "YYYY-MM-DD"
  return new Date(partes + 'T00:00:00').toDateString();
}

/**
 * Retorna la fecha "hoy" como string en zona de Caracas para comparaciones.
 */
export function hoyCaracas(): string {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
  return new Date(partes + 'T00:00:00').toDateString();
}
