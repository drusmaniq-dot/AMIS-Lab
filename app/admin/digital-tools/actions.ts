"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { digitalToolSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";
import type { DigitalToolFormState } from "@/components/digital-tool-form";

async function uploadScreenshot(formData: FormData) {
  const file = formData.get("screenshot");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "digital-tools")).url;
  }
  return undefined;
}

function parseDigitalTool(formData: FormData) {
  return digitalToolSchema.safeParse({
    title: formData.get("title"),
    titleAr: formData.get("titleAr"),
    description: formData.get("description"),
    descriptionAr: formData.get("descriptionAr"),
    url: formData.get("url") || undefined,
  });
}

export async function adminCreateDigitalTool(
  _prevState: DigitalToolFormState,
  formData: FormData
): Promise<DigitalToolFormState> {
  await requireAdmin();
  const parsed = parseDigitalTool(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const titleErr = requireOneOf(parsed.data.title, parsed.data.titleAr, "Title");
  if (titleErr) return { error: titleErr };
  const descErr = requireOneOf(parsed.data.description, parsed.data.descriptionAr, "Description");
  if (descErr) return { error: descErr };

  let screenshotUrl: string | undefined;
  try {
    screenshotUrl = await uploadScreenshot(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload image." };
  }

  const [title, description] = await Promise.all([
    resolveBilingual(parsed.data.title, parsed.data.titleAr),
    resolveBilingual(parsed.data.description, parsed.data.descriptionAr),
  ]);

  await prisma.digitalTool.create({
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      url: parsed.data.url || null,
      screenshotUrl,
      state: "PUBLISHED",
    },
  });

  revalidatePath("/admin/digital-tools");
  revalidatePath("/digital-tools");
  redirect("/admin/digital-tools");
}

export async function adminUpdateDigitalTool(
  id: string,
  _prevState: DigitalToolFormState,
  formData: FormData
): Promise<DigitalToolFormState> {
  await requireAdmin();
  const parsed = parseDigitalTool(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const titleErr = requireOneOf(parsed.data.title, parsed.data.titleAr, "Title");
  if (titleErr) return { error: titleErr };
  const descErr = requireOneOf(parsed.data.description, parsed.data.descriptionAr, "Description");
  if (descErr) return { error: descErr };

  let screenshotUrl: string | undefined;
  try {
    screenshotUrl = await uploadScreenshot(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload image." };
  }

  const [title, description] = await Promise.all([
    resolveBilingual(parsed.data.title, parsed.data.titleAr),
    resolveBilingual(parsed.data.description, parsed.data.descriptionAr),
  ]);

  await prisma.digitalTool.update({
    where: { id },
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      url: parsed.data.url || null,
      ...(screenshotUrl ? { screenshotUrl } : {}),
    },
  });

  revalidatePath("/admin/digital-tools");
  revalidatePath("/digital-tools");
  redirect("/admin/digital-tools");
}

export async function adminDeleteDigitalTool(id: string) {
  await requireAdmin();
  await prisma.digitalTool.delete({ where: { id } });
  revalidatePath("/admin/digital-tools");
  revalidatePath("/digital-tools");
}
