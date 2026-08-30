import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { projectSchema } from "@/lib/validations";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";

export async function uniqueProjectSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "project";
  let slug = base;
  let i = 1;
  while (
    await prisma.project.findFirst({ where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) } })
  ) {
    slug = `${base}-${++i}`;
  }
  return slug;
}

export function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    title: formData.get("title"),
    titleAr: formData.get("titleAr"),
    summary: formData.get("summary"),
    summaryAr: formData.get("summaryAr"),
    description: formData.get("description"),
    descriptionAr: formData.get("descriptionAr"),
    phase: formData.get("phase"),
    projectNumber: formData.get("projectNumber") || undefined,
    investigator: formData.get("investigator") || undefined,
    externalUrl: formData.get("externalUrl") || undefined,
    tags: formData.get("tags") || undefined,
  });
}

export async function resolveProjectFields(data: z.infer<typeof projectSchema>) {
  const titleErr = requireOneOf(data.title, data.titleAr, "Title");
  if (titleErr) return { error: titleErr } as const;
  const summaryErr = requireOneOf(data.summary, data.summaryAr, "Summary");
  if (summaryErr) return { error: summaryErr } as const;
  const descErr = requireOneOf(data.description, data.descriptionAr, "Description");
  if (descErr) return { error: descErr } as const;

  const [title, summary, description] = await Promise.all([
    resolveBilingual(data.title, data.titleAr),
    resolveBilingual(data.summary, data.summaryAr),
    resolveBilingual(data.description, data.descriptionAr),
  ]);

  return { ok: true, title, summary, description } as const;
}
