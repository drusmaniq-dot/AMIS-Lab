"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { notify } from "@/lib/notify";

export async function requestServiceAccess(serviceId: string) {
  const session = await requireAuth();

  const [service, alreadyGranted] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId }, select: { title: true } }),
    prisma.user.findFirst({
      where: { id: session.user.id, allowedServices: { some: { id: serviceId } } },
      select: { id: true },
    }),
  ]);
  if (!service || alreadyGranted) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { requestedServices: { connect: { id: serviceId } } },
  });

  await notify("service.access_requested", {
    userEmail: session.user.email,
    userName: session.user.name,
    service: service.title,
  });

  revalidatePath("/dashboard/services");
  revalidatePath("/admin/service-access");
}
