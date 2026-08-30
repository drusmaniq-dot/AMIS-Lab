import "server-only";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { translateText } from "@/lib/translate";
import type { SpecRow } from "@/components/specs-table-editor";

export async function uniqueEquipmentSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "equipment";
  let slug = base;
  let i = 1;
  while (
    await prisma.equipment.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } })
  ) {
    slug = `${base}-${++i}`;
  }
  return slug;
}

export function parseSpecRows(formData: FormData, labelField: string, valueField: string): SpecRow[] {
  const labels = formData.getAll(labelField).map(String);
  const values = formData.getAll(valueField).map(String);
  return labels
    .map((label, i) => ({ label: label.trim(), value: values[i]?.trim() ?? "" }))
    .filter((r) => r.label && r.value);
}

async function translateRows(rows: SpecRow[], source: "en" | "ar", target: "en" | "ar"): Promise<SpecRow[] | null> {
  const translated = await Promise.all(
    rows.map(async (r) => {
      const [label, value] = await Promise.all([
        translateText(r.label, source, target),
        translateText(r.value, source, target),
      ]);
      return { label: label ?? r.label, value: value ?? r.value };
    })
  );
  return translated;
}

/** Same auto-fill idea as resolveBilingual, but for a whole label/value table:
 * if one language's table is empty, translate every row from the other. */
export async function resolveSpecsTable(
  enRows: SpecRow[],
  arRows: SpecRow[]
): Promise<{ en: SpecRow[] | null; ar: SpecRow[] | null }> {
  if (enRows.length > 0 && arRows.length === 0) {
    return { en: enRows, ar: await translateRows(enRows, "en", "ar") };
  }
  if (arRows.length > 0 && enRows.length === 0) {
    return { en: await translateRows(arRows, "ar", "en"), ar: arRows };
  }
  return { en: enRows.length > 0 ? enRows : null, ar: arRows.length > 0 ? arRows : null };
}
