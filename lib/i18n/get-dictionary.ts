import "server-only";
import { dictionaries, type Dictionary } from "./dictionaries";
import { getLocale } from "./get-locale";
import type { Locale } from "./config";

export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}
