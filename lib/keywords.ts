const STOP_SINGLE_WORDS = new Set([
  "design",
  "theory",
  "technology",
  "application",
  "applications",
  "science",
  "research",
  "development",
  "properties",
  "systems",
  "analysis",
]);

const LOWERCASE_CONNECTORS = new Set(["of", "and", "in", "for", "the", "a", "an", "on", "to", "via", "with"]);

function titleCase(phrase: string): string {
  return phrase
    .split(" ")
    .map((word, i) => {
      // Preserve existing acronyms/mixed-case terms (e.g. "DSC", "THz-TDS") as-is.
      if (/[A-Z]/.test(word.slice(1))) return word;
      if (i > 0 && LOWERCASE_CONNECTORS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function singularKey(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("es")) return lower.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}

/** Best-effort extraction of short keyword tags from a list of full research-interest
 * sentences. Not real NLP — just splits on commas/"and", trims, and filters generic
 * single-word fragments, so naturally-short items (already keyword-like) pass through
 * untouched while long sentences get boiled down to their leading noun phrases. */
export function extractKeywords(interests: string[], max = 8): string[] {
  const candidates: string[] = [];

  for (const raw of interests) {
    const noParens = raw.replace(/\([^)]*\)/g, " ");
    const fragments = noParens.split(/,|;|:| and /i);
    for (const fragment of fragments) {
      const cleaned = fragment.trim().replace(/^[-–—:;]+|[.\s]+$/g, "");
      if (!cleaned) continue;
      const wordCount = cleaned.split(/\s+/).length;
      if (wordCount > 6) continue;
      if (wordCount === 1 && (cleaned.length < 4 || STOP_SINGLE_WORDS.has(cleaned.toLowerCase()))) continue;
      candidates.push(titleCase(cleaned));
    }
  }

  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = c
      .split(/\s+/)
      .map(singularKey)
      .join(" ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const score = (phrase: string) => {
    const words = phrase.split(/\s+/).length;
    if (words >= 2 && words <= 3) return 0;
    if (words === 1) return 1;
    return 2;
  };
  unique.sort((a, b) => score(a) - score(b));
  return unique.slice(0, max);
}
