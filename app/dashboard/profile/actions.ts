"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { personSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";

export type ProfileState = { error?: string; success?: boolean } | undefined;

export async function saveProfile(_prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await requireAuth();

  const labels = formData.getAll("profileLinkLabel").map(String);
  const urls = formData.getAll("profileLinkUrl").map(String);
  const profileLinks = labels
    .map((label, i) => ({ label: label.trim(), url: urls[i]?.trim() ?? "" }))
    .filter((l) => l.label && l.url);

  const parsed = personSchema.safeParse({
    fullName: formData.get("fullName"),
    titleOrRole: formData.get("titleOrRole"),
    titleOrRoleAr: formData.get("titleOrRoleAr"),
    bio: formData.get("bio"),
    bioAr: formData.get("bioAr"),
    category: formData.get("category"),
    profileLinks,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const roleError = requireOneOf(parsed.data.titleOrRole, parsed.data.titleOrRoleAr, "Role/title");
  if (roleError) return { error: roleError };
  const bioError = requireOneOf(parsed.data.bio, parsed.data.bioAr, "Bio");
  if (bioError) return { error: bioError };

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      const result = await getStorage().upload(photo, "people");
      photoUrl = result.url;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload photo." };
    }
  }

  const { profileLinks: links, fullName, category, titleOrRole, titleOrRoleAr, bio, bioAr } = parsed.data;
  const [role, bioResolved] = await Promise.all([
    resolveBilingual(titleOrRole, titleOrRoleAr),
    resolveBilingual(bio, bioAr),
  ]);

  const existing = await prisma.person.findUnique({ where: { userId: session.user.id } });

  const person = await prisma.person.upsert({
    where: { userId: session.user.id },
    update: {
      fullName,
      category,
      titleOrRole: role.en ?? "",
      titleOrRoleAr: role.ar,
      bio: bioResolved.en ?? "",
      bioAr: bioResolved.ar,
      ...(photoUrl ? { photoUrl } : {}),
      state: "PENDING",
      submittedById: session.user.id,
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
    create: {
      fullName,
      category,
      titleOrRole: role.en ?? "",
      titleOrRoleAr: role.ar,
      bio: bioResolved.en ?? "",
      bioAr: bioResolved.ar,
      photoUrl,
      userId: session.user.id,
      state: "PENDING",
      submittedById: session.user.id,
    },
  });

  await prisma.profileLink.deleteMany({ where: { personId: person.id } });
  if (links.length > 0) {
    await prisma.profileLink.createMany({
      data: links.map((link, i) => ({ ...link, personId: person.id, sortOrder: i })),
    });
  }

  revalidatePath("/people");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  if (!existing) revalidatePath("/admin/content/pending");

  return { success: true };
}
