"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth, ForbiddenError } from "@/lib/permissions";
import { parsePerson, resolvePersonFields, uploadPersonImage, uploadPersonCv } from "@/lib/person-form-shared";
import type { PersonFormState } from "@/components/person-form";

export type ProfileState = PersonFormState;

export async function saveProfile(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN" && session.user.role !== "TEAM") {
    throw new ForbiddenError("Only AMIS Lab Team members have a public profile to edit.");
  }

  const parsed = parsePerson(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolvePersonFields(formData, parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let photoUrl: string | undefined;
  let cvUrl: string | undefined;
  try {
    [photoUrl, cvUrl] = await Promise.all([uploadPersonImage(formData), uploadPersonCv(formData)]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }

  const { profileLinks, fullName, category, email, phone, citationCount, hIndex } = parsed.data;
  const { role, bio, academicDegree, address, discipline, subdiscipline, researchInterests, researchProjects, publications } =
    resolved;

  const existing = await prisma.person.findUnique({ where: { userId: session.user.id } });

  // A Team member's edits to an already-published profile go live
  // immediately — no re-approval — but a brand-new (or not-yet-approved)
  // profile still needs the first admin approval, same as before.
  const stateUpdate: Prisma.PersonUncheckedUpdateInput =
    session.user.role === "TEAM" && existing?.state === "PUBLISHED"
      ? {}
      : {
          state: "PENDING",
          submittedById: session.user.id,
          reviewedById: null,
          reviewedAt: null,
          rejectionReason: null,
        };

  const person = await prisma.person.upsert({
    where: { userId: session.user.id },
    update: {
      fullName,
      category,
      titleOrRole: role.en ?? "",
      titleOrRoleAr: role.ar,
      bio: bio.en ?? "",
      bioAr: bio.ar,
      email: email || null,
      phone: phone || null,
      citationCount: citationCount === "" || citationCount == null ? null : citationCount,
      hIndex: hIndex === "" || hIndex == null ? null : hIndex,
      academicDegree: academicDegree.en,
      academicDegreeAr: academicDegree.ar,
      address: address.en,
      addressAr: address.ar,
      discipline: discipline.en,
      disciplineAr: discipline.ar,
      subdiscipline: subdiscipline.en,
      subdisciplineAr: subdiscipline.ar,
      researchInterests: (researchInterests.en ?? undefined) as Prisma.InputJsonValue | undefined,
      researchInterestsAr: (researchInterests.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      researchProjects: (researchProjects.en ?? undefined) as Prisma.InputJsonValue | undefined,
      researchProjectsAr: (researchProjects.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      publications: (publications.length > 0 ? publications : undefined) as Prisma.InputJsonValue | undefined,
      ...(photoUrl ? { photoUrl } : {}),
      ...(cvUrl ? { cvUrl } : {}),
      ...stateUpdate,
    },
    create: {
      fullName,
      category,
      titleOrRole: role.en ?? "",
      titleOrRoleAr: role.ar,
      bio: bio.en ?? "",
      bioAr: bio.ar,
      photoUrl,
      cvUrl,
      email: email || null,
      phone: phone || null,
      citationCount: citationCount === "" || citationCount == null ? null : citationCount,
      hIndex: hIndex === "" || hIndex == null ? null : hIndex,
      academicDegree: academicDegree.en,
      academicDegreeAr: academicDegree.ar,
      address: address.en,
      addressAr: address.ar,
      discipline: discipline.en,
      disciplineAr: discipline.ar,
      subdiscipline: subdiscipline.en,
      subdisciplineAr: subdiscipline.ar,
      researchInterests: (researchInterests.en ?? undefined) as Prisma.InputJsonValue | undefined,
      researchInterestsAr: (researchInterests.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      researchProjects: (researchProjects.en ?? undefined) as Prisma.InputJsonValue | undefined,
      researchProjectsAr: (researchProjects.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      publications: (publications.length > 0 ? publications : undefined) as Prisma.InputJsonValue | undefined,
      userId: session.user.id,
      state: "PENDING",
      submittedById: session.user.id,
    },
  });

  await prisma.profileLink.deleteMany({ where: { personId: person.id } });
  if (profileLinks.length > 0) {
    await prisma.profileLink.createMany({
      data: profileLinks.map((link, i) => ({ ...link, personId: person.id, sortOrder: i })),
    });
  }

  revalidatePath("/people");
  revalidatePath("/publications");
  revalidatePath("/collaboration");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  if (!existing) revalidatePath("/admin/content/pending");

  return { success: true };
}
