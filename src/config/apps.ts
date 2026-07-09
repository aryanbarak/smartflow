const rawSmartAcademyUrl = import.meta.env.VITE_SMART_ACADEMY_URL;

export const SMART_ACADEMY_URL =
  typeof rawSmartAcademyUrl === "string" && rawSmartAcademyUrl.trim()
    ? rawSmartAcademyUrl.trim()
    : null;

export function getSmartAcademyUrl(): string | null {
  if (!SMART_ACADEMY_URL) return null;
  return SMART_ACADEMY_URL;
}
