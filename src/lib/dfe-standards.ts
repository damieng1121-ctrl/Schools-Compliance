/**
 * The 6 DfE "core standards" every school/college is expected to meet by
 * 2030 — the minimum baseline, distinct from the rest of the catalogue
 * which is still real DfE guidance but not part of that baseline.
 * https://www.gov.uk/guidance/meeting-digital-and-technology-standards-in-schools-and-colleges
 */
export const CORE_STANDARD_CODES = new Set([
  "broadband",
  "wireless-network",
  "network-switching",
  "cyber-security",
  "filtering-monitoring",
  "digital-leadership",
]);

export function isCoreStandard(code: string): boolean {
  return CORE_STANDARD_CODES.has(code);
}
