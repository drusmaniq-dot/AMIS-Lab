import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import type { SpecRow } from "@/components/specs-table-editor";

export default async function EquipmentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [equipment, { locale }] = await Promise.all([
    prisma.equipment.findFirst({ where: { slug, state: "PUBLISHED" } }),
    getDictionary(),
  ]);

  if (!equipment) notFound();

  const name = pickLocalized(locale, equipment.name, equipment.nameAr);
  const unit = pickLocalized(locale, equipment.unit, equipment.unitAr);
  const description = pickLocalized(locale, equipment.description, equipment.descriptionAr);
  const location = pickLocalized(locale, equipment.location, equipment.locationAr);
  const specsEn = (equipment.specsTable as unknown as SpecRow[] | null) ?? [];
  const specsAr = (equipment.specsTableAr as unknown as SpecRow[] | null) ?? [];
  const rows = locale === "ar" ? (specsAr.length > 0 ? specsAr : specsEn) : specsEn.length > 0 ? specsEn : specsAr;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      {unit && (
        <Badge variant="secondary" className="mb-2">
          {unit}
        </Badge>
      )}
      <h1 className="text-3xl font-bold text-primary">{name}</h1>
      {(equipment.model || equipment.manufacturer) && (
        <p className="mt-1 text-muted-foreground">
          {[equipment.manufacturer, equipment.model].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <p className="whitespace-pre-line text-muted-foreground">{description}</p>
          {location && (
            <p className="mt-4 text-sm">
              <span className="font-medium text-primary">
                {locale === "ar" ? "الموقع: " : "Location: "}
              </span>
              <span className="text-muted-foreground">{location}</span>
            </p>
          )}
        </div>

        <div>
          {equipment.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={equipment.imageUrl}
              alt={name}
              className="aspect-square w-full rounded-lg border-2 border-accent/30 object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-lg border-2 border-accent/30 bg-gradient-to-br from-muted to-accent/10 text-4xl font-semibold text-muted-foreground">
              {name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mt-10 border-t pt-8">
          <h2 className="text-xl font-bold text-primary">
            {locale === "ar" ? "المواصفات الفنية للشركة المصنعة" : "Manufacturer Technical Specifications"}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                    <th
                      scope="row"
                      className="w-1/3 border-b bg-primary/5 px-4 py-2.5 text-start font-medium text-primary last:border-b-0"
                    >
                      {row.label}
                    </th>
                    <td className="border-b px-4 py-2.5 text-muted-foreground last:border-b-0">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
