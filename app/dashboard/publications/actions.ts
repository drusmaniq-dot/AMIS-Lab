"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/permissions";
import { parsePublicationForm, resolvePublicationFields } from "@/lib/publication-helpers";

export type PublicationFormState = { error?: string } | undefined;

export async function createPublication(
  _prevState: PublicationFormState,
  formData: FormData
): Promise<PublicationFormState> {
  const session = await requireAuth();
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
      state: "PENDING",
      submittedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/publications");
  revalidatePath("/publications");
  redirect("/dashboard/publications");
}

export async function updatePublication(
  id: string,
  _prevState: PublicationFormState,
  formData: FormData
): Promise<PublicationFormState> {
  const existing = await prisma.publication.findUnique({ where: { id } });
  if (!existing) return { error: "Publication not found." };
  await requireOwnerOrAdmin(existing.submittedById);

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
      state: "PENDING",
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  });

  revalidatePath("/dashboard/publications");
  revalidatePath("/publications");
  redirect("/dashboard/publications");
}

export async function deleteOwnPublication(id: string) {
  const existing = await prisma.publication.findUnique({ where: { id } });
  if (!existing) return;
  await requireOwnerOrAdmin(existing.submittedById);
  await prisma.publication.delete({ where: { id } });
  revalidatePath("/dashboard/publications");
  revalidatePath("/publications");
}
