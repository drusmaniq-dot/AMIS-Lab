"use server";

import { prisma } from "@/lib/db";
import { contactMessageSchema } from "@/lib/validations";
import { notify } from "@/lib/notify";

export type ContactState = { error?: string; success?: boolean } | undefined;

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = contactMessageSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.contactMessage.create({ data: parsed.data });
  await notify("contact.message_received", { email: parsed.data.email });

  return { success: true };
}
