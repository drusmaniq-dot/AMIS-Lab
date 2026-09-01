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

// Ongoing reads as active/green, Completed as closed-out/red — Planned stays
// a neutral blue since neither color fits a project that hasn't started yet.
const phaseBadgeClass: Record<string, string> = {
  ONGOING: "border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300",
  COMPLETED: "border-red-300 bg-red-100 text-red-800 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300",
  PLANNED: "border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const phasePriority: Record<string, number> = { ONGOING: 0, PLANNED: 1, COMPLETED: 2 };

function SustainabilityIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-7" aria-hidden="true">
      <path
        d="M32 56 C32 40 42 28 56 24 C52 38 46 48 32 56 Z"
        fill="#6eaa02"
        fillOpacity="0.18"
        stroke="#6eaa02"
        strokeWidth="3"
      />
      <path d="M32 56 C34 44 42 34 52 27" fill="none" stroke="#6eaa02" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 44 L32 44" stroke="#6eaa02" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Same four research domains as the Home page's "Research Domains" section
// (same tags, same accent colors) — a project's `tags` array is checked for
// each domain's key, so a project tagged with more than one domain (e.g. both
// "bioglasses" and "optic-glasses") correctly appears in both sections.
function domainGroups(dict: Dictionary) {
  return [
    {
      key: "optic-glasses",
      title: dict.home.domainOpticTitle,
      accent: "#c82c39",
      tint: "#FBEFEF",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-optic.png" alt="" className="h-8 w-auto" />,
    },
    {
      key: "shielding-glasses",
      title: dict.home.domainShieldingTitle,
      accent: "#1c66a1",
      tint: "#EEF4FA",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-shielding.png" alt="" className="h-8 w-auto" />,
    },
    {
      key: "bioglasses",
      title: dict.home.domainBioTitle,
      accent: "#10a2a4",
      tint: "#EAF7F7",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-bio.png" alt="" className="h-8 w-auto" />,
    },
    {
      key: "sustainability",
      title: dict.home.domainSustainabilityTitle,
      accent: "#6eaa02",
      tint: "#F3F8EC",
      icon: <SustainabilityIcon />,
    },
  ];
}

export default async function ProjectsPage() {
  const [projects, { locale, dict }] = await Promise.all([
    prisma.project.findMany({ where: { state: "PUBLISHED" }, orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  const byPhase = (a: (typeof projects)[number], b: (typeof projects)[number]) => {
    const diff = (phasePriority[a.phase] ?? 99) - (phasePriority[b.phase] ?? 99);
    if (diff !== 0) return diff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  };

  // Ongoing projects are pinned in their own spotlight at the very top of the
  // page instead of being buried inside whichever domain section they'd
  // otherwise sort into — so the domain groups below only need the rest.
  const ongoingProjects = projects.filter((p) => p.phase === "ONGOING").sort(byPhase);
  const restProjects = projects.filter((p) => p.phase !== "ONGOING");

  const domains = domainGroups(dict);
  const domainKeys = new Set(domains.map((d) => d.key));
  const groups = domains.map((domain) => ({
    ...domain,
    projects: restProjects.filter((p) => p.tags.includes(domain.key)).sort(byPhase),
  }));
  // Anything not tagged with one of the four research domains (e.g. a purely
  // general "materials-science" project) still needs somewhere to show up.
  const otherProjects = restProjects.filter((p) => !p.tags.some((t) => domainKeys.has(t))).sort(byPhase);

  // Only the pinned Ongoing spotlight needs a domain badge — every other card
  // already sits inside a section whose heading names its domain, so adding
  // one there would just repeat what's already obvious from context.
  function ProjectCard({
    project,
    accent,
    showDomainBadges = false,
  }: {
    project: (typeof projects)[number];
    accent: string;
    showDomainBadges?: boolean;
  }) {
    const title = pickLocalized(locale, project.title, project.titleAr);
    const summary = pickLocalized(locale, project.summary, project.summaryAr);
    const projectDomains = showDomainBadges ? domains.filter((d) => project.tags.includes(d.key)) : [];
    return (
      <div
        className="flex flex-col gap-4 rounded-lg border border-s-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center"
        style={{ borderInlineStartColor: accent }}
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
            <Badge className={phaseBadgeClass[project.phase] ?? ""}>{phaseLabel(dict, project.phase)}</Badge>
            {projectDomains.map((d) => (
              <Badge
                key={d.key}
                className="border"
                style={{ backgroundColor: d.tint, color: d.accent, borderColor: `${d.accent}55` }}
              >
                {d.title}
              </Badge>
            ))}
            {project.tags
              .filter((tag) => !domainKeys.has(tag))
              .map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
          </div>
          <p className="mt-1.5 font-semibold text-primary">{title}</p>
          {(project.projectNumber || project.investigator) && (
            <p className="mt-1 text-xs font-medium text-accent">
              {[project.projectNumber && `${dict.projects.projectNumber}: ${project.projectNumber}`, project.investigator]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{summary}</p>
        </div>
        <Button size="sm" className="shrink-0 self-start sm:self-center" render={<Link href={`/projects/${project.slug}`} />}>
          {locale === "ar" ? "المزيد <<" : "More >>"}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.projects.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.projects.subheading}</p>

      {projects.length === 0 && <p className="mt-8 text-muted-foreground">{dict.projects.empty}</p>}

      {ongoingProjects.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
            </span>
            <h2 className="text-lg font-bold text-green-800 dark:text-green-300">{dict.projects.ongoing}</h2>
            <span className="ms-auto text-sm font-medium text-muted-foreground">{ongoingProjects.length}</span>
          </div>
          <div className="mt-4 flex flex-col gap-4">
            {ongoingProjects.map((project) => (
              <ProjectCard key={project.id} project={project} accent="#16a34a" showDomainBadges />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col gap-12">
        {groups
          .filter((g) => g.projects.length > 0)
          .map((group) => (
            <section key={group.key}>
              <div
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
                style={{ backgroundColor: group.tint, borderColor: `${group.accent}2a` }}
              >
                {group.icon}
                <h2 className="text-lg font-bold" style={{ color: group.accent }}>
                  {group.title}
                </h2>
                <span className="ms-auto text-sm font-medium text-muted-foreground">{group.projects.length}</span>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {group.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} accent={group.accent} />
                ))}
              </div>
            </section>
          ))}

        {otherProjects.length > 0 && (
          <section>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
              <h2 className="text-lg font-bold text-muted-foreground">{dict.projects.otherDomain}</h2>
              <span className="ms-auto text-sm font-medium text-muted-foreground">{otherProjects.length}</span>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {otherProjects.map((project) => (
                <ProjectCard key={project.id} project={project} accent="var(--muted-foreground)" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
