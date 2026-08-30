import "server-only";

export type Locale = "en" | "ar";

// Free, keyless MyMemory API — good enough for "auto-fill the language the admin
// didn't type," not meant to be publication-quality. Swap this function for a
// paid provider (DeepL/Google/Azure Translator) later without touching callers.
const MAX_CHUNK = 450; // MyMemory's free tier caps around ~500 bytes per request

async function translateChunk(text: string, source: Locale, target: Locale): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText;
    return typeof translated === "string" && translated.length > 0 ? translated : null;
  } catch {
    return null;
  }
}

function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > MAX_CHUNK) {
    let splitAt = remaining.lastIndexOf(". ", MAX_CHUNK);
    if (splitAt < MAX_CHUNK * 0.4) splitAt = remaining.lastIndexOf(" ", MAX_CHUNK);
    if (splitAt < 1) splitAt = MAX_CHUNK;
    chunks.push(remaining.slice(0, splitAt + 1).trim());
    remaining = remaining.slice(splitAt + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

/** Best-effort machine translation. Returns null on any failure — callers should
 * treat a null result as "leave the other language blank," never as fatal. */
export async function translateText(text: string, source: Locale, target: Locale): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const chunks = chunkText(trimmed);
  const results = await Promise.all(chunks.map((c) => translateChunk(c, source, target)));
  if (results.some((r) => r === null)) return null;
  return results.join(" ");
}

/** Given an EN/AR pair where at least one side is filled in, auto-translates
 * whichever side is empty. Leaves both untouched if both (or neither) are filled. */
export async function fillMissingTranslation(
  en: string | null | undefined,
  ar: string | null | undefined
): Promise<{ en: string | null; ar: string | null }> {
  const enTrim = en?.trim() || null;
  const arTrim = ar?.trim() || null;

  if (enTrim && !arTrim) {
    return { en: enTrim, ar: await translateText(enTrim, "en", "ar") };
  }
  if (arTrim && !enTrim) {
    return { en: await translateText(arTrim, "ar", "en"), ar: arTrim };
  }
  return { en: enTrim, ar: arTrim };
}
