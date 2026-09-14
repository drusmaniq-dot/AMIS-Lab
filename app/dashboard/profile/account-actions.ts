"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: "Enter your current password." }),
  newPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
});

export type ChangePasswordState = { error?: string; success?: boolean } | undefined;

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await requireAuth();

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return { error: "This account signs in with Google and has no password to change." };
  }

  const currentValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentValid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } });

  return { success: true };
}
