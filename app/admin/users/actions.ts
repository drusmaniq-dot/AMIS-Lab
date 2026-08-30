"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import type { Role, UserStatus } from "@/lib/generated/prisma/client";

export async function setUserRole(userId: string, role: Role) {
  const session = await requireAdmin();
  if (session.user.id === userId && role !== "ADMIN") {
    throw new Error("You can't remove your own admin role.");
  }
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}

export async function setUserStatus(userId: string, status: UserStatus) {
  const session = await requireAdmin();
  if (session.user.id === userId && status !== "APPROVED") {
    throw new Error("You can't suspend your own account.");
  }
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/signups");
}
