"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export type ContentKind = "person" | "project" | "publication";

const MODEL = {
  person: prisma.person,
  project: prisma.project,
  publication: prisma.publication,
} as const;

const PUBLIC_PATHS: Record<ContentKind, string> = {
  person: "/people",
  project: "/projects",
  publication: "/publications",
};

export async function approveContent(kind: ContentKind, id: string) {
  const session = await requireAdmin();
  // @ts-expect-error -- each model's update() has a distinct WhereUniqueInput type; id-only lookup is valid for all three.
  await MODEL[kind].update({
    where: { id },
    data: { state: "PUBLISHED", reviewedById: session.user.id, reviewedAt: new Date(), rejectionReason: null },
  });
  revalidatePath("/admin/content/pending");
  revalidatePath(PUBLIC_PATHS[kind]);
  revalidatePath("/admin");
}

export async function rejectContent(kind: ContentKind, id: string, reason: string) {
  const session = await requireAdmin();
  // @ts-expect-error -- each model's update() has a distinct WhereUniqueInput type; id-only lookup is valid for all three.
  await MODEL[kind].update({
    where: { id },
    data: {
      state: "REJECTED",
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason || "No reason given.",
    },
  });
  revalidatePath("/admin/content/pending");
  revalidatePath(PUBLIC_PATHS[kind]);
  revalidatePath("/admin");
}
