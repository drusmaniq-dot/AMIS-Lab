"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { getStorage } from "@/lib/storage";
import { uniqueProjectSlug, parseProjectForm, resolveProjectFields } from "@/lib/project-helpers";
import type { ProjectFormState } from "@/components/project-form";

export async function adminCreateProject(_prevState: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const session = await requireAdmin();

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
      state: "PUBLISHED",
      submittedById: session.user.id,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  redirect("/admin/projects");
}

export async function adminUpdateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  const existing = await prisma.project.findUnique({ where: { id } });
  if (!existing) return { error: "Project not found." };

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
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  redirect("/admin/projects");
}

export async function adminDeleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
  revalidatePath("/projects");
}
