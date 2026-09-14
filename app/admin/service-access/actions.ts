"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";

export async function setServiceAccess(userId: string, serviceId: string, granted: boolean) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: {
      allowedServices: granted ? { connect: { id: serviceId } } : { disconnect: { id: serviceId } },
      // Granting access resolves any outstanding request for the same service.
      requestedServices: granted ? { disconnect: { id: serviceId } } : undefined,
    },
  });
  revalidatePath("/admin/service-access");
  revalidatePath("/dashboard/services");
}
