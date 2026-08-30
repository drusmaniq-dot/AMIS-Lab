import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";

export default async function DigitalToolsPage() {
  const [tools, { locale, dict }] = await Promise.all([
    prisma.digitalTool.findMany({ where: { state: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    getDictionary(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.digitalTools.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.digitalTools.subheading}</p>

      {tools.length === 0 && <p className="mt-8 text-muted-foreground">{dict.digitalTools.empty}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const title = pickLocalized(locale, tool.title, tool.titleAr);
          const description = pickLocalized(locale, tool.description, tool.descriptionAr);
          return (
            <Card key={tool.id} className="overflow-hidden py-0">
              {tool.screenshotUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tool.screenshotUrl}
                  alt={title}
                  className="aspect-video w-full object-cover"
                />
              )}
              <CardHeader className="pt-4">
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                {tool.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    render={<a href={tool.url} target="_blank" rel="noreferrer noopener" />}
                  >
                    {dict.digitalTools.openTool}
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
