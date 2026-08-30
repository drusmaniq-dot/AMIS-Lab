"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { equipmentSchema } from "@/lib/validations";
import { getStorage } from "@/lib/storage";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";
import { uniqueEquipmentSlug, parseSpecRows, resolveSpecsTable } from "@/lib/equipment-helpers";
import type { EquipmentFormState } from "@/components/equipment-form";

function parseEquipment(formData: FormData) {
  return equipmentSchema.safeParse({
    name: formData.get("name"),
    nameAr: formData.get("nameAr"),
    unit: formData.get("unit") || undefined,
    unitAr: formData.get("unitAr") || undefined,
    model: formData.get("model") || undefined,
    manufacturer: formData.get("manufacturer") || undefined,
    description: formData.get("description"),
    descriptionAr: formData.get("descriptionAr"),
    location: formData.get("location") || undefined,
    locationAr: formData.get("locationAr") || undefined,
  });
}

async function uploadImage(formData: FormData) {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    return (await getStorage().upload(file, "equipment")).url;
  }
  return undefined;
}

async function resolveEquipmentFields(data: {
  name?: string;
  nameAr?: string;
  unit?: string;
  unitAr?: string;
  description?: string;
  descriptionAr?: string;
  location?: string;
  locationAr?: string;
}) {
  const nameErr = requireOneOf(data.name, data.nameAr, "Name");
  if (nameErr) return { error: nameErr } as const;
  const descErr = requireOneOf(data.description, data.descriptionAr, "Description");
  if (descErr) return { error: descErr } as const;

  const [name, unit, description, location] = await Promise.all([
    resolveBilingual(data.name, data.nameAr),
    resolveBilingual(data.unit, data.unitAr),
    resolveBilingual(data.description, data.descriptionAr),
    resolveBilingual(data.location, data.locationAr),
  ]);

  return { ok: true, name, unit, description, location } as const;
}

export async function adminCreateEquipment(
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  await requireAdmin();
  const parsed = parseEquipment(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveEquipmentFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadImage(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload image." };
  }

  const enRows = parseSpecRows(formData, "specsTableLabel", "specsTableValue");
  const arRows = parseSpecRows(formData, "specsTableArLabel", "specsTableArValue");
  const specsTable = await resolveSpecsTable(enRows, arRows);

  const { name, unit, description, location } = resolved;
  const { model, manufacturer } = parsed.data;
  const slug = await uniqueEquipmentSlug(name.en ?? "equipment");

  await prisma.equipment.create({
    data: {
      slug,
      name: name.en ?? "",
      nameAr: name.ar,
      unit: unit.en,
      unitAr: unit.ar,
      model: model || null,
      manufacturer: manufacturer || null,
      description: description.en ?? "",
      descriptionAr: description.ar,
      specsTable: (specsTable.en ?? undefined) as Prisma.InputJsonValue | undefined,
      specsTableAr: (specsTable.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      location: location.en,
      locationAr: location.ar,
      imageUrl,
      state: "PUBLISHED",
    },
  });

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  redirect("/admin/equipment");
}

export async function adminUpdateEquipment(
  id: string,
  _prevState: EquipmentFormState,
  formData: FormData
): Promise<EquipmentFormState> {
  await requireAdmin();
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) return { error: "Equipment not found." };

  const parsed = parseEquipment(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveEquipmentFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  let imageUrl: string | undefined;
  try {
    imageUrl = await uploadImage(formData);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to upload image." };
  }

  const enRows = parseSpecRows(formData, "specsTableLabel", "specsTableValue");
  const arRows = parseSpecRows(formData, "specsTableArLabel", "specsTableArValue");
  const specsTable = await resolveSpecsTable(enRows, arRows);

  const { name, unit, description, location } = resolved;
  const { model, manufacturer } = parsed.data;
  const slug = name.en && name.en !== existing.name ? await uniqueEquipmentSlug(name.en, id) : existing.slug;

  await prisma.equipment.update({
    where: { id },
    data: {
      slug,
      name: name.en ?? "",
      nameAr: name.ar,
      unit: unit.en,
      unitAr: unit.ar,
      model: model || null,
      manufacturer: manufacturer || null,
      description: description.en ?? "",
      descriptionAr: description.ar,
      specsTable: (specsTable.en ?? undefined) as Prisma.InputJsonValue | undefined,
      specsTableAr: (specsTable.ar ?? undefined) as Prisma.InputJsonValue | undefined,
      location: location.en,
      locationAr: location.ar,
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
  revalidatePath(`/equipment/${slug}`);
  redirect("/admin/equipment");
}

export async function adminDeleteEquipment(id: string) {
  await requireAdmin();
  await prisma.equipment.delete({ where: { id } });
  revalidatePath("/admin/equipment");
  revalidatePath("/equipment");
}
