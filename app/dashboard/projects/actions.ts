"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/permissions";
import { getStorage } from "@/lib/storage";
import { uniqueProjectSlug, parseProjectForm, resolveProjectFields } from "@/lib/project-helpers";

export type ProjectFormState = { error?: string } | undefined;

export async function createProject(_prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const session = await requireAuth();

  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveProjectFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let coverImageUrl: string | undefined;
  const cover = formData.get("coverImage");
  if (cover instanceof File && cover.size > 0) {
    try {
      coverImageUrl = (await getStorage().upload(cover, "projects")).url;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload image." };
    }
  }

  const { tags, externalUrl, phase, projectNumber, investigator } = parsed.data;
  const { title, summary, description } = resolved;
  const slug = await uniqueProjectSlug(title.en ?? "project");

  await prisma.project.create({
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      summary: summary.en ?? "",
      summaryAr: summary.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      phase,
      slug,
      coverImageUrl,
      projectNumber: projectNumber || null,
      investigator: investigator || null,
      externalUrl: externalUrl || null,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      state: "PENDING",
      submittedById: session.user.id,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
  redirect("/dashboard/projects");
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "Project not found." };
  await requireOwnerOrAdmin(existing.submittedById);

  const parsed = parseProjectForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveProjectFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let coverImageUrl: string | undefined;
  const cover = formData.get("coverImage");
  if (cover instanceof File && cover.size > 0) {
    try {
      coverImageUrl = (await getStorage().upload(cover, "projects")).url;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload image." };
    }
  }

  const { tags, externalUrl, phase, projectNumber, investigator } = parsed.data;
  const { title, summary, description } = resolved;
  const slug = title.en && title.en !== existing.title ? await uniqueProjectSlug(title.en, id) : existing.slug;

  await prisma.project.update({
    where: { id },
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      summary: summary.en ?? "",
      summaryAr: summary.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      phase,
      slug,
      projectNumber: projectNumber || null,
      investigator: investigator || null,
      externalUrl: externalUrl || null,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      ...(coverImageUrl ? { coverImageUrl } : {}),
      state: "PENDING",
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  redirect("/dashboard/projects");
}

export async function deleteOwnProject(id: string) {
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return;
  await requireOwnerOrAdmin(existing.submittedById);
  await prisma.project.delete({ where: { id } });
  revalidatePath("/dashboard/projects");
  revalidatePath("/projects");
}
