"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { personSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";
import { parseStringListField, resolveStringList, parsePublications } from "@/lib/person-cv-helpers";
import type { PersonFormState } from "@/components/person-form";

function parseLinks(formData: FormData) {
  const labels = formData.getAll("profileLinkLabel").map(String);
  const urls = formData.getAll("profileLinkUrl").map(String);
  return labels
    .map((label, i) => ({ label: label.trim(), url: urls[i]?.trim() ?? "" }))
    .filter((l) => l.label && l.url);
}

function parsePerson(formData: FormData) {
  return personSchema.safeParse({
    fullName: formData.get("fullName"),
    titleOrRole: formData.get("titleOrRole"),
    titleOrRoleAr: formData.get("titleOrRoleAr"),
    bio: formData.get("bio"),
    bioAr: formData.get("bioAr"),
    category: formData.get("category"),
    profileLinks: parseLinks(formData),
    academicDegree: formData.get("academicDegree") || undefined,
    academicDegreeAr: formData.get("academicDegreeAr") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    addressAr: formData.get("addressAr") || undefined,
    discipline: formData.get("discipline") || undefined,
    disciplineAr: formData.get("disciplineAr") || undefined,
    subdiscipline: formData.get("subdiscipline") || undefined,
    subdisciplineAr: formData.get("subdisciplineAr") || undefined,
    citationCount: formData.get("citationCount") || undefined,
    hIndex: formData.get("hIndex") || undefined,
  });
}

async function uploadImage(formData: FormData) {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "people")).url;
  }
  return undefined;
}

async function uploadCv(formData: FormData) {
  const file = formData.get("cv");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "people-cv", "document")).url;
  }
  return undefined;
}

async function resolvePersonFields(formData: FormData, data: NonNullable<ReturnType<typeof parsePerson>["data"]>) {
  const roleError = requireOneOf(data.titleOrRole, data.titleOrRoleAr, "Role/title");
  if (roleError) return { error: roleError } as const;
  const bioError = requireOneOf(data.bio, data.bioAr, "Bio");
  if (bioError) return { error: bioError } as const;

  const [role, bio, academicDegree, address, discipline, subdiscipline] = await Promise.all([
    resolveBilingual(data.titleOrRole, data.titleOrRoleAr),
    resolveBilingual(data.bio, data.bioAr),
    resolveBilingual(data.academicDegree, data.academicDegreeAr),
    resolveBilingual(data.address, data.addressAr),
    resolveBilingual(data.discipline, data.disciplineAr),
    resolveBilingual(data.subdiscipline, data.subdisciplineAr),
  ]);

  const researchInterestsEn = parseStringListField(formData, "researchInterests");
  const researchInterestsAr = parseStringListField(formData, "researchInterestsAr");
  const researchProjectsEn = parseStringListField(formData, "researchProjects");
  const researchProjectsAr = parseStringListField(formData, "researchProjectsAr");
  const [researchInterests, researchProjects] = await Promise.all([
    resolveStringList(researchInterestsEn, researchInterestsAr),
    resolveStringList(researchProjectsEn, researchProjectsAr),
  ]);

  const publications = parsePublications(formData);

  return {
    ok: true,
    role,
    bio,
    academicDegree,
    address,
    discipline,
    subdiscipline,
    researchInterests,
    researchProjects,
    publications,
  } as const;
}

export async function adminCreatePerson(_prevState: PersonFormState, formData: FormData): Promise<PersonFormState> {
  const session = await requireAdmin();

  const parsed = parsePerson(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolvePersonFields(formData, parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let photoUrl: string | undefined;
  let cvUrl: string | undefined;
  try {
    [photoUrl, cvUrl] = await Promise.all([uploadImage(formData), uploadCv(formData)]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }

  const { profileLinks, fullName, category, email, phone, citationCount, hIndex } = parsed.data;
  const { role, bio, academicDegree, address, discipline, subdiscipline, researchInterests, researchProjects, publications } =
    resolved;

  const person = await prisma.person.create({
    data: {
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
      state: "PUBLISHED",
      submittedById: session.user.id,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      profileLinks: { create: profileLinks.map((l, i) => ({ ...l, sortOrder: i })) },
    },
  });

  revalidatePath("/admin/people");
  revalidatePath("/people");
  redirect(`/admin/people/${person.id}/edit`);
}

export async function adminUpdatePerson(
  id: string,
  _prevState: PersonFormState,
  formData: FormData
): Promise<PersonFormState> {
  await requireAdmin();

  const parsed = parsePerson(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolvePersonFields(formData, parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let photoUrl: string | undefined;
  let cvUrl: string | undefined;
  try {
    [photoUrl, cvUrl] = await Promise.all([uploadImage(formData), uploadCv(formData)]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload file." };
  }

  const { profileLinks, fullName, category, email, phone, citationCount, hIndex } = parsed.data;
  const { role, bio, academicDegree, address, discipline, subdiscipline, researchInterests, researchProjects, publications } =
    resolved;

  await prisma.person.update({
    where: { id },
    data: {
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
    },
  });
  await prisma.profileLink.deleteMany({ where: { personId: id } });
  if (profileLinks.length > 0) {
    await prisma.profileLink.createMany({
      data: profileLinks.map((l, i) => ({ ...l, personId: id, sortOrder: i })),
    });
  }

  revalidatePath("/admin/people");
  revalidatePath("/people");

  return { success: true };
}

export async function adminDeletePerson(id: string) {
  await requireAdmin();
  await prisma.person.delete({ where: { id } });
  revalidatePath("/admin/people");
  revalidatePath("/people");
}
