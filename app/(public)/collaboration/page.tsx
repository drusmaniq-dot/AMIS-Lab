import { prisma } from "@/lib/db";
import { CollaborationNetwork, type CollaborationNode, type CollaborationEdge } from "@/components/collaboration-network";
import { CollaborationGlobe, type GlobeNode, type GlobeEdge } from "@/components/collaboration-globe";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import { AUTHOR_ALIASES } from "@/lib/author-aliases";
import { LAB_MANAGEMENT_ALIASES } from "@/lib/lab-management-aliases";
import { COLLABORATOR_LOCATIONS } from "@/lib/collaborator-locations";

const CATEGORY_TIER: Record<string, number> = {
  DIRECTOR: 0,
  FACULTY: 1,
  STUDENT: 2,
  STAFF: 1,
  ALUMNI: 2,
};

// Given his exceptionally strong collaboration volume with the Director, Khalid
// sits on his own tier between Director and Research Team, above Hany and closer
// to the center — a deliberate visual break from the flat per-category tiering.
const TIER_OVERRIDES: Record<string, number> = {
  "Dr. Khalid Ibrahim Hussein Ibrahim": 0.5,
  "Reem Dhafer Alshehri": 0.55,
  "Prof. Dr. Alaa Dahshan": 0.6,
  "Elham Fahad Alkhammash": 1.9,
};

function shortTitle(titleOrRole: string): string {
  return titleOrRole.split(",")[0].trim();
}

function shortName(fullName: string): string {
  return fullName.replace(/^(Prof\.\s*Dr\.|Dr\.)\s*/i, "").trim();
}

// Frequent external (non-lab-member) collaborators shown by name only, no Person
// profile — sourced from real co-authorship in the publications table, and each
// verified against the actual co-authored paper's affiliation metadata (via
// Crossref/OpenAlex) rather than assumed. Some appear under more than one
// short-form byline across the bulk-imported record, hence `aliases` being an
// array. `includeInTierDiagram` is false for collaborators only shown on the
// globe — the 2D tier diagram stays focused on KKU Central Labs specifically.
const EXTERNAL_COLLABORATORS: {
  id: string;
  name: string;
  title: string;
  aliases: string[];
  photoUrl: string | null;
  tier: number;
  includeInTierDiagram: boolean;
}[] = [
  {
    id: "external-ms-alqahtani",
    name: "Mohammed S. Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Prof. Dr. Mohammed S. Alqahtani"],
    photoUrl: "/uploads/people/0ad3c287-190a-40a9-8fd2-2139b6ca6cdd.jpg",
    tier: 0,
    includeInTierDiagram: true,
  },
  {
    id: "external-fawaz-alqahtani",
    name: "Fawaz Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Dr. Fawaz Alqahtani"],
    photoUrl: "/uploads/people/e431c7cb-4560-4df6-bcf6-aa1558f5f8cb.jpg",
    tier: 0,
    includeInTierDiagram: true,
  },
  {
    id: "external-reben",
    name: "Manuela Reben",
    title: "AGH University of Science and Technology, Poland",
    aliases: ["M Reben"],
    photoUrl: null,
    tier: 0.1,
    includeInTierDiagram: true,
  },
  {
    id: "external-shaaban",
    name: "Essam Ramadan Shaaban",
    title: "Al-Azhar University, Egypt",
    aliases: ["ER Shaaban"],
    photoUrl: null,
    tier: 0.1,
    includeInTierDiagram: true,
  },
  {
    id: "external-aly",
    name: "Kamal A. Aly",
    title: "University of Jeddah, Saudi Arabia",
    aliases: ["KA Aly"],
    photoUrl: null,
    tier: 0.9,
    includeInTierDiagram: true,
  },
  {
    id: "external-mehta",
    name: "Neeraj Mehta",
    title: "Banaras Hindu University, India",
    aliases: ["N Mehta"],
    photoUrl: null,
    tier: 1.3,
    includeInTierDiagram: true,
  },
  {
    id: "external-mohamed",
    name: "Ehab Mahmoud Mohamed",
    title: "Prince Sattam Bin Abdulaziz University, Saudi Arabia",
    aliases: ["EM Mohamed"],
    photoUrl: null,
    tier: 1.1,
    includeInTierDiagram: true,
  },
  {
    id: "external-ismeil",
    name: "Mohamed A. Ismeil",
    title: "King Khalid University",
    aliases: ["MA Ismeil"],
    photoUrl: null,
    tier: 1.7,
    includeInTierDiagram: true,
  },
];

export default async function CollaborationPage() {
  const { dict, locale } = await getDictionary();
  const [people, publications] = await Promise.all([
    prisma.person.findMany({
      where: { state: "PUBLISHED", fullName: { in: Object.keys(AUTHOR_ALIASES) } },
      orderBy: [{ sortOrder: "asc" }],
    }),
    prisma.publication.findMany({ where: { state: "PUBLISHED" }, select: { authors: true } }),
  ]);

  const aliasesById = new Map<string, string[]>();
  for (const p of people) aliasesById.set(p.id, [AUTHOR_ALIASES[p.fullName]]);
  for (const ext of EXTERNAL_COLLABORATORS) aliasesById.set(ext.id, ext.aliases);

  // Full entity list — every Person plus every external collaborator, real name
  // preserved (not yet tier-sorted or shortened) — the shared basis for both the
  // tier diagram (a filtered subset) and the globe (everyone).
  type Entity = { id: string; fullName: string; name: string; title: string; photoUrl: string | null; tier: number; includeInTierDiagram: boolean };
  const allEntities: Entity[] = [
    ...people.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      name: shortName(p.fullName),
      title: shortTitle(pickLocalized(locale, p.titleOrRole, p.titleOrRoleAr)),
      photoUrl: p.photoUrl,
      tier: TIER_OVERRIDES[p.fullName] ?? CATEGORY_TIER[p.category] ?? 1,
      includeInTierDiagram: true,
    })),
    ...EXTERNAL_COLLABORATORS.map((ext) => ({
      id: ext.id,
      fullName: ext.name,
      name: ext.name,
      title: ext.title,
      photoUrl: ext.photoUrl,
      tier: ext.tier,
      includeInTierDiagram: ext.includeInTierDiagram,
    })),
  ];

  const allEdges: CollaborationEdge[] = [];
  for (let i = 0; i < allEntities.length; i++) {
    for (let j = i + 1; j < allEntities.length; j++) {
      const aAliases = aliasesById.get(allEntities[i].id)!;
      const bAliases = aliasesById.get(allEntities[j].id)!;
      const count = publications.filter(
        (pub) => aAliases.some((a) => pub.authors.includes(a)) && bAliases.some((b) => pub.authors.includes(b))
      ).length;
      allEdges.push({ fromId: allEntities[i].id, toId: allEntities[j].id, count });
    }
  }

  // --- Tier diagram: KKU Central Labs only, unchanged from before ---
  const tierEntities = allEntities.filter((e) => e.includeInTierDiagram);
  const tierNodes: CollaborationNode[] = tierEntities
    .map((e) => ({ id: e.id, name: e.name, title: e.title, photoUrl: e.photoUrl, tier: e.tier }))
    .sort((a, b) => a.tier - b.tier);
  const tier0 = tierNodes.filter((n) => n.tier === 0);
  const director = tier0.find((n) => n.name.includes("Yousef"));
  if (director && tier0.length === 3) {
    const flankers = tier0.filter((n) => n !== director);
    const ordered = [flankers[0], director, flankers[1]];
    const others = tierNodes.filter((n) => n.tier !== 0);
    tierNodes.splice(0, tierNodes.length, ...ordered, ...others);
  }
  const tierIds = new Set(tierNodes.map((n) => n.id));
  const tierEdges = allEdges.filter((e) => tierIds.has(e.fromId) && tierIds.has(e.toId));

  // --- Globe: everyone, placed at their real institutional location ---
  const globeNodes: GlobeNode[] = allEntities
    .map((e) => {
      const location = COLLABORATOR_LOCATIONS[e.fullName];
      if (!location) return null;
      return { id: e.id, name: e.name, title: e.title, photoUrl: e.photoUrl, location };
    })
    .filter((n): n is GlobeNode => n !== null);
  const globeEdges: GlobeEdge[] = allEdges;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.collaboration.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.collaboration.subheading}</p>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-primary">{dict.collaboration.globeHeading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.collaboration.globeSubheading}</p>
        <div className="mt-4">
          <CollaborationGlobe nodes={globeNodes} edges={globeEdges} />
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-bold text-primary">{dict.collaboration.internalHeading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.collaboration.internalSubheading}</p>
        <div className="mt-6">
          <CollaborationNetwork
            nodes={tierNodes}
            edges={tierEdges}
            dict={{
              director: dict.collaboration.director,
              researchTeam: dict.collaboration.researchTeam,
              students: dict.collaboration.students,
              papersLabel: dict.collaboration.papersLabel,
              noSharedPapers: dict.collaboration.noSharedPapers,
            }}
          />
        </div>
      </div>
    </div>
  );
}
