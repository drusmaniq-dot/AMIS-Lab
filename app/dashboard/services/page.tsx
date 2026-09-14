import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import { ServiceRequestButton } from "./service-request-button";

export default async function DashboardServicesPage() {
  const session = await requireAuth();
  const { locale, dict } = await getDictionary();

  const [services, me] = await Promise.all([
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        allowedServices: { select: { id: true } },
        requestedServices: { select: { id: true } },
      },
    }),
  ]);

  const allowedIds = new Set(me?.allowedServices.map((s) => s.id));
  const requestedIds = new Set(me?.requestedServices.map((s) => s.id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{dict.dashboard.myServices}</h1>

      {services.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{dict.dashboard.noServicesExist}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const title = pickLocalized(locale, service.title, service.titleAr);
            const description = pickLocalized(locale, service.description, service.descriptionAr);
            const granted = allowedIds.has(service.id);
            const requested = requestedIds.has(service.id);

            return (
              <Card key={service.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <CardTitle className="text-base">{title}</CardTitle>
                  {granted ? (
                    <Badge className="border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                      {dict.dashboard.granted}
                    </Badge>
                  ) : requested ? (
                    <Badge variant="outline">{dict.dashboard.requested}</Badge>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  <div className="mt-3">
                    {granted ? (
                      service.ctaUrl ? (
                        <Button size="sm" render={<Link href={service.ctaUrl} target="_blank" rel="noreferrer noopener" />}>
                          {dict.dashboard.useService}
                        </Button>
                      ) : null
                    ) : requested ? (
                      <p className="text-xs text-muted-foreground">{dict.dashboard.requestedPending}</p>
                    ) : (
                      <ServiceRequestButton serviceId={service.id} label={dict.dashboard.requestAccessButton} />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
