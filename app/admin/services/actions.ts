"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { serviceSchema } from "@/lib/validations";
import { requireOneOf, resolveBilingual } from "@/lib/bilingual";
import type { ServiceFormState } from "@/components/service-form";

function parseService(formData: FormData) {
  return serviceSchema.safeParse({
    title: formData.get("title"),
    titleAr: formData.get("titleAr"),
    description: formData.get("description"),
    descriptionAr: formData.get("descriptionAr"),
    ctaLabel: formData.get("ctaLabel") || undefined,
    ctaLabelAr: formData.get("ctaLabelAr") || undefined,
    ctaUrl: formData.get("ctaUrl") || undefined,
    ctaEmail: formData.get("ctaEmail") || undefined,
  });
}

async function resolveServiceFields(data: {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  ctaLabel?: string;
  ctaLabelAr?: string;
}) {
  const titleErr = requireOneOf(data.title, data.titleAr, "Title");
  if (titleErr) return { error: titleErr } as const;
  const descErr = requireOneOf(data.description, data.descriptionAr, "Description");
  if (descErr) return { error: descErr } as const;

  const [title, description, ctaLabel] = await Promise.all([
    resolveBilingual(data.title, data.titleAr),
    resolveBilingual(data.description, data.descriptionAr),
    resolveBilingual(data.ctaLabel, data.ctaLabelAr),
  ]);

  return { ok: true, title, description, ctaLabel } as const;
}

export async function adminCreateService(_prevState: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await requireAdmin();
  const parsed = parseService(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveServiceFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  const { ctaUrl, ctaEmail } = parsed.data;
  const { title, description, ctaLabel } = resolved;

  await prisma.service.create({
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      ctaLabel: ctaLabel.en,
      ctaLabelAr: ctaLabel.ar,
      ctaUrl: ctaUrl || null,
      ctaEmail: ctaEmail || null,
      state: "PUBLISHED",
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect("/admin/services");
}

export async function adminUpdateService(
  id: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  await requireAdmin();
  const parsed = parseService(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const resolved = await resolveServiceFields(parsed.data);
  if ("error" in resolved) return { error: resolved.error };

  const { ctaUrl, ctaEmail } = parsed.data;
  const { title, description, ctaLabel } = resolved;

  await prisma.service.update({
    where: { id },
    data: {
      title: title.en ?? "",
      titleAr: title.ar,
      description: description.en ?? "",
      descriptionAr: description.ar,
      ctaLabel: ctaLabel.en,
      ctaLabelAr: ctaLabel.ar,
      ctaUrl: ctaUrl || null,
      ctaEmail: ctaEmail || null,
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/services");
  redirect("/admin/services");
}

export async function adminDeleteService(id: string) {
  await requireAdmin();
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath("/services");
}
