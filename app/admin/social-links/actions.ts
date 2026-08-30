"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { socialLinkSchema } from "@/lib/validations";

export type SocialLinkFormState = { error?: string } | undefined;

export async function addSocialLink(
  _prevState: SocialLinkFormState,
  formData: FormData
): Promise<SocialLinkFormState> {
  await requireAdmin();
  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    url: formData.get("url"),
    icon: formData.get("icon") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const count = await prisma.socialLink.count();
  await prisma.socialLink.create({ data: { ...parsed.data, sortOrder: count } });

  revalidatePath("/admin/social-links");
  revalidatePath("/");
  return undefined;
}

export async function toggleSocialLink(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.socialLink.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/social-links");
  revalidatePath("/");
}

export async function deleteSocialLink(id: string) {
  await requireAdmin();
  await prisma.socialLink.delete({ where: { id } });
  revalidatePath("/admin/social-links");
  revalidatePath("/");
}
