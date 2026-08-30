import "server-only";
import { fillMissingTranslation } from "@/lib/translate";

/** Throws-as-return-value: returns an error string if both language variants of
 * a required bilingual field are empty, otherwise null. */
export function requireOneOf(
  en: string | null | undefined,
  ar: string | null | undefined,
  fieldLabel: string
): string | null {
  if (!en?.trim() && !ar?.trim()) return `${fieldLabel} is required (in English or Arabic).`;
  return null;
}

/** Resolves a bilingual field pair for saving: fills in whichever side is
 * blank via machine translation. Never throws — a failed translation just
 * leaves that side null, which callers persist as-is. */
export async function resolveBilingual(en: string | null | undefined, ar: string | null | undefined) {
  return fillMissingTranslation(en, ar);
}
