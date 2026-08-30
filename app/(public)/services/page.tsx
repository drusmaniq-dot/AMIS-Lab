import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";

export default async function ServicesPage() {
  const [services, { locale, dict }] = await Promise.all([
    prisma.service.findMany({ where: { state: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    getDictionary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.services.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.services.subheading}</p>

      {services.length === 0 && <p className="mt-8 text-muted-foreground">{dict.services.empty}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {services.map((service) => {
          const title = pickLocalized(locale, service.title, service.titleAr);
          const description = pickLocalized(locale, service.description, service.descriptionAr);
          const ctaLabel = pickLocalized(locale, service.ctaLabel, service.ctaLabelAr);
          return (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
                {(service.ctaUrl || service.ctaEmail) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    render={
                      <a href={service.ctaUrl || `mailto:${service.ctaEmail}`} target="_blank" rel="noreferrer noopener" />
                    }
                  >
                    {ctaLabel || dict.services.getInTouch}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
