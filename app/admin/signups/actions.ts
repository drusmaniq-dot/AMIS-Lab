"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { notify } from "@/lib/notify";

export async function approveSignup(userId: string) {
  await requireAdmin();
  const user = await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  await notify("member.signup_approved", { email: user.email });
  revalidatePath("/admin/signups");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function rejectSignup(userId: string) {
  await requireAdmin();
  const user = await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } });
  await notify("member.signup_rejected", { email: user.email });
  revalidatePath("/admin/signups");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
