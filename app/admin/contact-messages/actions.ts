"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function markMessageRead(id: string, isRead: boolean) {
  await requireAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { isRead } });
  revalidatePath("/admin/contact-messages");
  revalidatePath("/admin");
}

export async function deleteContactMessage(id: string) {
  await requireAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/contact-messages");
  revalidatePath("/admin");
}
