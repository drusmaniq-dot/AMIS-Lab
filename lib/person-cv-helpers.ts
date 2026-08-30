import "server-only";
import { translateText, type Locale } from "@/lib/translate";

export function parseStringListField(formData: FormData, fieldName: string): string[] {
  return formData
    .getAll(fieldName)
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function translateStrings(items: string[], source: Locale, target: Locale): Promise<string[]> {
  const translated = await Promise.all(items.map((s) => translateText(s, source, target)));
  return translated.map((t, i) => t ?? items[i]);
}

/** Same auto-fill idea as resolveBilingual, but for a whole list: if one language's
 * list is empty, translate every item from the other. */
export async function resolveStringList(
  enList: string[],
  arList: string[]
): Promise<{ en: string[] | null; ar: string[] | null }> {
  if (enList.length > 0 && arList.length === 0) {
    return { en: enList, ar: await translateStrings(enList, "en", "ar") };
  }
  if (arList.length > 0 && enList.length === 0) {
    return { en: await translateStrings(arList, "ar", "en"), ar: arList };
  }
  return { en: enList.length > 0 ? enList : null, ar: arList.length > 0 ? arList : null };
}

export interface PublicationValue {
  citation: string;
  url?: string;
}

export function parsePublications(formData: FormData): PublicationValue[] {
  const citations = formData.getAll("publicationCitation").map(String);
  const urls = formData.getAll("publicationUrl").map(String);
  return citations
    .map((c, i) => ({ citation: c.trim(), url: urls[i]?.trim() || undefined }))
    .filter((p) => p.citation);
}
