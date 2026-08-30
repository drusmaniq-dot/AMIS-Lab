import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function phaseLabel(dict: Dictionary, phase: string): string {
  const map: Record<string, string> = {
    PLANNED: dict.projects.planned,
    ONGOING: dict.projects.ongoing,
    COMPLETED: dict.projects.completed,
  };
  return map[phase] ?? phase;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, { locale, dict }] = await Promise.all([
    prisma.project.findFirst({ where: { slug, state: "PUBLISHED" } }),
    getDictionary(),
  ]);

  if (!project) notFound();

  const title = pickLocalized(locale, project.title, project.titleAr);
  const summary = pickLocalized(locale, project.summary, project.summaryAr);
  const description = pickLocalized(locale, project.description, project.descriptionAr);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{phaseLabel(dict, project.phase)}</Badge>
        {project.tags.map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>
      <h1 className="mt-3 text-3xl font-bold text-primary">{title}</h1>
      {(project.projectNumber || project.investigator) && (
        <p className="mt-2 text-sm font-medium text-accent">
          {[
            project.projectNumber && `${dict.projects.projectNumber}: ${project.projectNumber}`,
            project.investigator,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
      <p className="mt-2 text-lg text-muted-foreground">{summary}</p>

      {project.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverImageUrl}
          alt={title}
          className="mt-6 aspect-video w-full rounded-lg object-cover"
        />
      )}

      <div className="mt-6 whitespace-pre-line text-muted-foreground">{description}</div>

      {project.imageUrls.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {project.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="aspect-square rounded-md object-cover" />
          ))}
        </div>
      )}

      {project.externalUrl && (
        <a
          href={project.externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-8 inline-block font-medium text-accent underline-offset-4 hover:underline"
        >
          {dict.projects.visitLink} {locale === "ar" ? "←" : "→"}
        </a>
      )}
    </div>
  );
}
