"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { siteSettingsSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";

export type SettingsFormState = { error?: string; success?: boolean } | undefined;

export async function updateSiteSettings(
  _prevState: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = siteSettingsSchema.safeParse({
    homeIntroTitle: formData.get("homeIntroTitle"),
    homeIntroTitleAr: formData.get("homeIntroTitleAr"),
    homeIntroBody: formData.get("homeIntroBody"),
    homeIntroBodyAr: formData.get("homeIntroBodyAr"),
    directorName: formData.get("directorName"),
    directorMessage: formData.get("directorMessage"),
    directorMessageAr: formData.get("directorMessageAr"),
    contactAddress: formData.get("contactAddress") || undefined,
    contactAddressAr: formData.get("contactAddressAr") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    mapEmbedUrl: formData.get("mapEmbedUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const titleErr = requireOneOf(parsed.data.homeIntroTitle, parsed.data.homeIntroTitleAr, "Home intro title");
  if (titleErr) return { error: titleErr };
  const bodyErr = requireOneOf(parsed.data.homeIntroBody, parsed.data.homeIntroBodyAr, "Home intro text");
  if (bodyErr) return { error: bodyErr };
  const msgErr = requireOneOf(parsed.data.directorMessage, parsed.data.directorMessageAr, "Director's message");
  if (msgErr) return { error: msgErr };

  let directorPhotoUrl: string | undefined;
  const photo = formData.get("directorPhoto");
  if (photo instanceof File && photo.size > 0) {
    try {
      directorPhotoUrl = (await getStorage().upload(photo, "settings")).url;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to upload photo." };
    }
  }

  const [homeIntroTitle, homeIntroBody, directorMessage, contactAddress] = await Promise.all([
    resolveBilingual(parsed.data.homeIntroTitle, parsed.data.homeIntroTitleAr),
    resolveBilingual(parsed.data.homeIntroBody, parsed.data.homeIntroBodyAr),
    resolveBilingual(parsed.data.directorMessage, parsed.data.directorMessageAr),
    resolveBilingual(parsed.data.contactAddress, parsed.data.contactAddressAr),
  ]);

  const { directorName, contactEmail, contactPhone, mapEmbedUrl } = parsed.data;

  const shared = {
    homeIntroTitle: homeIntroTitle.en ?? "",
    homeIntroTitleAr: homeIntroTitle.ar,
    homeIntroBody: homeIntroBody.en ?? "",
    homeIntroBodyAr: homeIntroBody.ar,
    directorName,
    directorMessage: directorMessage.en ?? "",
    directorMessageAr: directorMessage.ar,
    contactAddress: contactAddress.en,
    contactAddressAr: contactAddress.ar,
    contactEmail: contactEmail || null,
    contactPhone: contactPhone || null,
    mapEmbedUrl: mapEmbedUrl || null,
  };

  await prisma.siteSettings.upsert({
    where: { id: "1" },
    update: { ...shared, ...(directorPhotoUrl ? { directorPhotoUrl } : {}) },
    create: { id: "1", ...shared, directorPhotoUrl },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/contact");

  return { success: true };
}
