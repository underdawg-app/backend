export const DEFAULT_COUNTRY_CODE = '+91';

/**
 * Split any raw phone (e.g. '+919876543210', '919876543210', '9876543210')
 * into the canonical national number (last 10 digits) and the dial/country code
 * (e.g. '+91'). The national value is the single key used across the system.
 */
export function splitPhone(raw: string): { national: string; countryCode: string } {
  const digits = (raw ?? '').replace(/\D/g, '');
  const national = digits.slice(-10);
  const cc = digits.slice(0, digits.length - 10);
  return { national, countryCode: cc ? `+${cc}` : DEFAULT_COUNTRY_CODE };
}
