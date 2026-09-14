"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { onboardingSchema } from "@/lib/validations";

export type OnboardingState = { error?: string; success?: boolean } | undefined;

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const session = await requireAuth();

  const parsed = onboardingSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing && existing.id !== session.user.id) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email: normalizedEmail, passwordHash, profileComplete: true },
  });

  return { success: true };
}
