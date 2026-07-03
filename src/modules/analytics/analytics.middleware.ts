/**
 * Clamps a raw limit value to a safe range.
 *
 * @param value    - Raw value from query (may be undefined).
 * @param max      - Hard upper ceiling.
 * @param fallback - Default when value is undefined or 0.
 * @returns        A limit that is always between 1 and max (inclusive).
 */
export function clampLimit(value: number | undefined, max: number, fallback: number): number {
  if (value === undefined || value <= 0) return Math.min(fallback, max);
  return Math.min(value, max);
}
