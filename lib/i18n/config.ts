export type Locale = "en" | "ar";
export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

/** Picks the field matching `locale`, falling back to the English value when the
 * Arabic side is empty (or vice versa) — content is never blank just because one
 * language wasn't filled in. */
export function pickLocalized(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined
): string {
  if (locale === "ar") return ar?.trim() || en?.trim() || "";
  return en?.trim() || ar?.trim() || "";
}
