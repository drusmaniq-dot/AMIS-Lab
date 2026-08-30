import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";

export default async function EquipmentPage() {
  const [equipment, { locale, dict }] = await Promise.all([
    prisma.equipment.findMany({ where: { state: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    getDictionary(),
  ]);

  const groups = new Map<string, { label: string; items: typeof equipment }>();
  for (const item of equipment) {
    const label = pickLocalized(locale, item.unit, item.unitAr) || dict.equipment.heading;
    const key = item.unit ?? "__general__";
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(item);
  }
  const groupList = Array.from(groups.entries());
  const accents = [
    "border-s-primary",
    "border-s-accent",
    "border-s-secondary",
    "border-s-brand-red",
    "border-s-brand-green",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.equipment.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.equipment.subheading}</p>

      {equipment.length === 0 && <p className="mt-8 text-muted-foreground">{dict.equipment.empty}</p>}

      {groupList.length > 0 && (
        <Tabs defaultValue={groupList[0][0]} className="mt-8">
          <TabsList variant="line" className="h-auto flex-wrap">
            {groupList.map(([key, group]) => (
              <TabsTrigger key={key} value={key}>
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {groupList.map(([key, group], groupIndex) => (
            <TabsContent key={key} value={key} className="mt-6">
              <div className="flex flex-col gap-4">
                {group.items.map((item) => {
                  const name = pickLocalized(locale, item.name, item.nameAr);
                  const description = pickLocalized(locale, item.description, item.descriptionAr);
                  const accent = accents[groupIndex % accents.length];
                  return (
                    <HoverCard key={item.id}>
                      <HoverCardTrigger
                        render={
                          <div
                            className={`flex flex-col gap-4 rounded-lg border border-s-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center ${accent}`}
                          />
                        }
                      >
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={name}
                            className="aspect-video w-full shrink-0 rounded-md border border-accent/20 object-cover sm:w-56"
                          />
                        ) : (
                          <div className="flex aspect-video w-full shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-muted to-accent/10 text-2xl font-semibold text-muted-foreground sm:w-56">
                            {name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-primary">{name}</p>
                          {(item.manufacturer || item.model) && (
                            <p className="mt-0.5 text-xs font-medium text-accent">
                              {[item.manufacturer, item.model].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
                        </div>
                        <Button
                          size="sm"
                          className="shrink-0 self-start sm:self-center"
                          render={<Link href={`/equipment/${item.slug}`} />}
                        >
                          {locale === "ar" ? "المزيد <<" : "More >>"}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="font-semibold text-primary">{name}</p>
                        <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{description}</p>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
