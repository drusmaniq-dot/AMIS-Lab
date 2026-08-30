import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
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

const phasePriority: Record<string, number> = { ONGOING: 0, PLANNED: 1, COMPLETED: 2 };
const phaseAccent: Record<string, string> = {
  ONGOING: "border-s-accent",
  PLANNED: "border-s-brand-blue",
  COMPLETED: "border-s-muted-foreground/30",
};

export default async function ProjectsPage() {
  const [projects, { locale, dict }] = await Promise.all([
    prisma.project.findMany({ where: { state: "PUBLISHED" }, orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  const sortedProjects = [...projects].sort((a, b) => {
    const diff = (phasePriority[a.phase] ?? 99) - (phasePriority[b.phase] ?? 99);
    if (diff !== 0) return diff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.projects.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.projects.subheading}</p>

      {sortedProjects.length === 0 && <p className="mt-8 text-muted-foreground">{dict.projects.empty}</p>}

      <div className="mt-8 flex flex-col gap-4">
        {sortedProjects.map((project) => {
          const title = pickLocalized(locale, project.title, project.titleAr);
          const summary = pickLocalized(locale, project.summary, project.summaryAr);
          const accent = phaseAccent[project.phase] ?? "border-s-border";
          return (
            <div
              key={project.id}
              className={`flex flex-col gap-4 rounded-lg border border-s-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center ${accent}`}
            >
              {project.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={project.coverImageUrl}
                  alt={title}
                  className="aspect-video w-full shrink-0 rounded-md border border-accent/20 object-cover sm:w-56"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{phaseLabel(dict, project.phase)}</Badge>
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 font-semibold text-primary">{title}</p>
                {(project.projectNumber || project.investigator) && (
                  <p className="mt-1 text-xs font-medium text-accent">
                    {[
                      project.projectNumber && `${dict.projects.projectNumber}: ${project.projectNumber}`,
                      project.investigator,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
              </div>
              <Button
                size="sm"
                className="shrink-0 self-start sm:self-center"
                render={<Link href={`/projects/${project.slug}`} />}
              >
                {locale === "ar" ? "المزيد <<" : "More >>"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
