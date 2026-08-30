"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { homeMediaSchema } from "@/lib/validations";
import { resolveBilingual } from "@/lib/bilingual";

export type HomeMediaFormState = { error?: string } | undefined;

export async function addHomeMedia(_prevState: HomeMediaFormState, formData: FormData): Promise<HomeMediaFormState> {
  await requireAdmin();
  const parsed = homeMediaSchema.safeParse({
    type: formData.get("type"),
    url: formData.get("url"),
    caption: formData.get("caption") || undefined,
    captionAr: formData.get("captionAr") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const caption = await resolveBilingual(parsed.data.caption, parsed.data.captionAr);
  const count = await prisma.homeMedia.count();
  await prisma.homeMedia.create({
    data: { type: parsed.data.type, url: parsed.data.url, caption: caption.en, captionAr: caption.ar, sortOrder: count },
  });

  revalidatePath("/admin/home-media");
  revalidatePath("/");
  return undefined;
}

export async function toggleHomeMedia(id: string, isActive: boolean) {
  await requireAdmin();
  await prisma.homeMedia.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/home-media");
  revalidatePath("/");
}

export async function deleteHomeMedia(id: string) {
  await requireAdmin();
  await prisma.homeMedia.delete({ where: { id } });
  revalidatePath("/admin/home-media");
  revalidatePath("/");
}
