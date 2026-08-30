import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { CollapsibleBio } from "@/components/collapsible-bio";
import { CvModalTrigger } from "@/components/cv-modal";
import { resolveIcon, resolveIconColor } from "@/lib/social-icons";
import { Mail } from "lucide-react";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getSession } from "@/lib/permissions";

function buildMailtoHref(
  recipientEmail: string,
  recipientName: string,
  dict: Dictionary,
  sender?: { name?: string | null; email?: string | null } | null
): string {
  const bodyLines = [`${dict.people.mailGreeting} ${recipientName},`, "", "", `${dict.people.mailSignoff},`];
  if (sender?.name || sender?.email) {
    if (sender.name) bodyLines.push(sender.name);
    if (sender.email) bodyLines.push(sender.email);
  }
  // mailto: URIs expect %20 for spaces (RFC 6068) — URLSearchParams would use "+" instead, so encode manually.
  const subject = encodeURIComponent(dict.people.mailSubject);
  const body = encodeURIComponent(bodyLines.join("\n"));
  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}

function localizedList(locale: Locale, en: unknown, ar: unknown): string[] {
  const enList = Array.isArray(en) ? (en as string[]) : [];
  const arList = Array.isArray(ar) ? (ar as string[]) : [];
  if (locale === "ar") return arList.length > 0 ? arList : enList;
  return enList.length > 0 ? enList : arList;
}

function hasCvContent(person: {
  cvUrl: string | null;
  academicDegree: string | null;
  discipline: string | null;
  subdiscipline: string | null;
  researchInterests: unknown;
  researchProjects: unknown;
  publications: unknown;
}): boolean {
  if (person.cvUrl) return true;
  if (person.academicDegree || person.discipline || person.subdiscipline) return true;
  const hasItems = (v: unknown) => Array.isArray(v) && v.length > 0;
  return hasItems(person.researchInterests) || hasItems(person.researchProjects) || hasItems(person.publications);
}

const CATEGORY_ORDER = ["LAB_MANAGEMENT", "DIRECTOR", "FACULTY", "STUDENT", "STAFF", "ALUMNI"] as const;

function categoryLabel(dict: Dictionary, category: string): string {
  const map: Record<string, string> = {
    LAB_MANAGEMENT: dict.people.labManagement,
    DIRECTOR: dict.people.director,
    FACULTY: dict.people.faculty,
    STUDENT: dict.people.students,
    ALUMNI: dict.people.alumni,
    STAFF: dict.people.staff,
  };
  return map[category] ?? category;
}

export default async function PeoplePage() {
  const [people, { locale, dict }, session] = await Promise.all([
    prisma.person.findMany({
      where: { state: "PUBLISHED" },
      include: { profileLinks: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
    }),
    getDictionary(),
    getSession(),
  ]);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    people: people.filter((p) => p.category === category),
  })).filter((g) => g.people.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.people.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.people.subheading}</p>

      {grouped.length === 0 && <p className="mt-8 text-muted-foreground">{dict.people.empty}</p>}

      {grouped.map((group) => (
        <section key={group.category} className="mt-10">
          <h2 className="text-xl font-semibold text-primary">{categoryLabel(dict, group.category)}</h2>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.people.map((person) => {
              const titleOrRole = pickLocalized(locale, person.titleOrRole, person.titleOrRoleAr);
              const bio = pickLocalized(locale, person.bio, person.bioAr);
              return (
                <Card key={person.id} className="h-[26rem]">
                  <CardContent className="flex h-full flex-col items-center gap-3 overflow-hidden pt-2 text-center">
                    {person.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.photoUrl}
                        alt={person.fullName}
                        className="size-24 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
                        {person.fullName.charAt(0)}
                      </div>
                    )}
                    <div className="shrink-0">
                      <p className="font-semibold">{person.fullName}</p>
                      <p className="text-sm text-accent">{titleOrRole}</p>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <CollapsibleBio bio={bio} />
                    </div>
                    {(hasCvContent(person) || person.profileLinks.length > 0 || person.email) && (
                      <div className="flex shrink-0 items-center gap-2 pt-1">
                        {hasCvContent(person) && (
                          <CvModalTrigger
                            label={dict.people.viewCv}
                            dict={{
                              personalInformation: dict.people.cvPersonalInformation,
                              name: dict.people.cvName,
                              qualification: dict.people.cvQualification,
                              address: dict.people.cvAddress,
                              researchInterests: dict.people.cvResearchInterests,
                              publications: dict.people.cvPublications,
                              researchProfileLinks: dict.people.cvResearchProfileLinks,
                              downloadPdf: dict.people.cvDownloadPdf,
                            }}
                            data={{
                              fullName: person.fullName,
                              titleOrRole,
                              academicDegree: pickLocalized(locale, person.academicDegree ?? "", person.academicDegreeAr ?? "") || null,
                              email: person.email,
                              phone: person.phone,
                              address: pickLocalized(locale, person.address ?? "", person.addressAr ?? "") || null,
                              discipline: pickLocalized(locale, person.discipline ?? "", person.disciplineAr ?? "") || null,
                              subdiscipline: pickLocalized(locale, person.subdiscipline ?? "", person.subdisciplineAr ?? "") || null,
                              researchInterests: localizedList(locale, person.researchInterests, person.researchInterestsAr),
                              researchProjects: localizedList(locale, person.researchProjects, person.researchProjectsAr),
                              publications: (person.publications as unknown as { citation: string; url?: string }[] | null) ?? [],
                              profileLinks: person.profileLinks.map((l) => ({ label: l.label, url: l.url })),
                              downloadHref: person.cvUrl,
                              photoUrl: person.photoUrl,
                            }}
                          />
                        )}
                        {person.profileLinks.map((link) => {
                          const Icon = resolveIcon(link.icon ?? link.label);
                          const brandColor = resolveIconColor(link.icon ?? link.label);
                          return (
                            <Link
                              key={link.id}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              aria-label={link.label}
                              className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
                            >
                              <Icon className="size-4" style={brandColor ? { color: brandColor } : undefined} />
                            </Link>
                          );
                        })}
                        {person.email && (
                          <Link
                            href={buildMailtoHref(person.email, person.fullName, dict, session?.user)}
                            aria-label={dict.people.emailAria}
                            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Mail className="size-4" />
                          </Link>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
