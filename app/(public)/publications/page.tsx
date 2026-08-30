import { prisma } from "@/lib/db";
import { PublicationsExplorer, type PublicationItem } from "@/components/publications-explorer";
import { PeopleStatsPanel, type PersonStatItem } from "@/components/people-stats-panel";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import { AUTHOR_ALIASES } from "@/lib/author-aliases";
import { LAB_MANAGEMENT_ALIASES } from "@/lib/lab-management-aliases";

const CATEGORY_ORDER = ["LAB_MANAGEMENT", "DIRECTOR", "FACULTY", "STUDENT", "STAFF", "ALUMNI"] as const;

export default async function PublicationsPage() {
  const [publications, people, { locale, dict }] = await Promise.all([
    prisma.publication.findMany({
      where: { state: "PUBLISHED" },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    }),
    prisma.person.findMany({
      where: { state: "PUBLISHED" },
      include: { profileLinks: true },
      orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
    }),
    getDictionary(),
  ]);

  const items: PublicationItem[] = publications.map((p) => ({
    id: p.id,
    title: pickLocalized(locale, p.title, p.titleAr),
    authors: p.authors,
    venue: p.venue,
    year: p.year,
    type: p.type,
    doiOrLink: p.doiOrLink,
    keywords: (p.keywords as unknown as string[] | null) ?? [],
  }));

  const orderedPeople = CATEGORY_ORDER.flatMap((category) => people.filter((p) => p.category === category));
  const statItems: PersonStatItem[] = orderedPeople.map((p) => {
    const aliases = LAB_MANAGEMENT_ALIASES[p.fullName] ?? (AUTHOR_ALIASES[p.fullName] ? [AUTHOR_ALIASES[p.fullName]] : []);
    const scholarLink = p.profileLinks.find((l) => l.label.toLowerCase().includes("scholar"));
    return {
      id: p.id,
      fullName: p.fullName,
      titleOrRole: pickLocalized(locale, p.titleOrRole, p.titleOrRoleAr),
      totalPublications: publications.filter((pub) => aliases.some((a) => pub.authors.includes(a))).length,
      hIndex: p.hIndex,
      citationCount: p.citationCount,
      scholarUrl: scholarLink?.url ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.publications.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.publications.subheading}</p>

      <div className="mt-8 lg:flex lg:items-start lg:gap-10">
        <div className="min-w-0 flex-1">
          <PublicationsExplorer
            publications={items}
            labMemberAliases={Object.values(AUTHOR_ALIASES)}
            dict={{
              tabPatents: dict.publications.tabPatents,
              tabJournal: dict.publications.tabJournal,
              tabConference: dict.publications.tabConference,
              tabBooks: dict.publications.tabBooks,
              searchPlaceholder: dict.publications.searchPlaceholder,
              filterAuthor: dict.publications.filterAuthor,
              filterYear: dict.publications.filterYear,
              allAuthors: dict.publications.allAuthors,
              allYears: dict.publications.allYears,
              viewMore: dict.publications.viewMore,
              showLess: dict.publications.showLess,
              noResults: dict.publications.noResults,
              clearFilters: dict.publications.clearFilters,
              viewPublication: dict.publications.viewPublication,
              empty: dict.publications.empty,
            }}
          />
        </div>

        <div className="mt-10 lg:mt-0">
          <PeopleStatsPanel
            people={statItems}
            dict={{
              heading: dict.people.statsHeading,
              publications: dict.people.statsPublications,
              hIndex: dict.people.statsHIndex,
              citations: dict.people.statsCitations,
              noData: dict.people.statsNoData,
              viewScholar: dict.people.statsViewScholar,
            }}
          />
        </div>
      </div>
    </div>
  );
}
