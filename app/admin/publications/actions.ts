"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { parsePublicationForm, resolvePublicationFields } from "@/lib/publication-helpers";
import type { PublicationFormState } from "@/components/publication-form";

export async function adminCreatePublication(
  _prevState: PublicationFormState,
  formData: FormData
): Promise<PublicationFormState> {
  const session = await requireAdmin();
  const parsed = parsePublicationForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolvePublicationFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  const { authors, venue, year, type, doiOrLink } = parsed.data;
  const { title, abstract } = resolved;

  await prisma.publication.create({
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      venue,
      year,
      type,
      doiOrLink: doiOrLink || null,
      abstract: abstract.en,
      abstractAr: abstract.ar,
      state: "PUBLISHED",
      submittedById: session.user.id,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/publications");
  revalidatePath("/publications");
  redirect("/admin/publications");
}

export async function adminUpdatePublication(
  id: string,
  _prevState: PublicationFormState,
  formData: FormData
): Promise<PublicationFormState> {
  await requireAdmin();
  const parsed = parsePublicationForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolvePublicationFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  const { authors, venue, year, type, doiOrLink } = parsed.data;
  const { title, abstract } = resolved;

  await prisma.publication.update({
    where: { id },
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      venue,
      year,
      type,
      doiOrLink: doiOrLink || null,
      abstract: abstract.en,
      abstractAr: abstract.ar,
    },
  });

  revalidatePath("/admin/publications");
  revalidatePath("/publications");
  redirect("/admin/publications");
}

export async function adminDeletePublication(id: string) {
  await requireAdmin();
  await prisma.publication.delete({ where: { id } });
  revalidatePath("/admin/publications");
  revalidatePath("/publications");
}
