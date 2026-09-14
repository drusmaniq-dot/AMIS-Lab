import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { ServiceAccessMatrix } from "./service-access-matrix";

export default async function AdminServiceAccessPage() {
  await requireAdmin();

  const [members, services] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        allowedServices: { select: { id: true } },
        requestedServices: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({ select: { id: true, title: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Service Access</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Control which services each approved member can use. Members with a pending or suspended account can&rsquo;t
        sign in at all, so their access here has no effect until they&rsquo;re approved.
      </p>

      {members.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No members yet.</p>
      ) : services.length === 0 ? (
        <p className="mt-8 text-muted-foreground">No services exist yet — add one under Content &rsquo; Services first.</p>
      ) : (
        <ServiceAccessMatrix
          members={members.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            status: m.status,
            allowedServiceIds: m.allowedServices.map((s) => s.id),
            requestedServiceIds: m.requestedServices.map((s) => s.id),
          }))}
          services={services}
        />
      )}
    </div>
  );
}
