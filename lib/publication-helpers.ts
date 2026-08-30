import "server-only";
import { z } from "zod";
import { publicationSchema } from "@/lib/validations";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";

export function parsePublicationForm(formData: FormData) {
  return publicationSchema.safeParse({
    title: formData.get("title"),
    titleAr: formData.get("titleAr"),
    authors: formData.get("authors"),
    venue: formData.get("venue"),
    year: formData.get("year"),
    type: formData.get("type"),
    doiOrLink: formData.get("doiOrLink") || undefined,
    abstract: formData.get("abstract") || undefined,
    abstractAr: formData.get("abstractAr") || undefined,
  });
}

export async function resolvePublicationFields(data: z.infer<typeof publicationSchema>) {
  const titleErr = requireOneOf(data.title, data.titleAr, "Title");
  if (titleErr) return { error: titleErr } as const;

  const [title, abstract] = await Promise.all([
    resolveBilingual(data.title, data.titleAr),
    resolveBilingual(data.abstract, data.abstractAr),
  ]);

  return { ok: true, title, abstract } as const;
}
