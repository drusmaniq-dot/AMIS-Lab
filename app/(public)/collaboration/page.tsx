import { prisma } from "@/lib/db";
import { CollaborationNetwork, type CollaborationNode, type CollaborationEdge } from "@/components/collaboration-network";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import { AUTHOR_ALIASES } from "@/lib/author-aliases";
import { LAB_MANAGEMENT_ALIASES } from "@/lib/lab-management-aliases";

// A 3D version of this graph (components/collaboration-graph-3d.tsx, data via
// lib/collaboration-graph.ts) is built and working, but temporarily not rendered
// here while its camera-framing bug is finished. Re-add when ready.

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
};

function shortTitle(titleOrRole: string): string {
  return titleOrRole.split(",")[0].trim();
}

function shortName(fullName: string): string {
  return fullName.replace(/^(Prof\.\s*Dr\.|Dr\.)\s*/i, "").trim();
}

// Frequent external (non-lab-member) collaborators shown by name only, no Person
// profile — sourced from real co-authorship in the publications table. Some
// appear under more than one short-form byline across the bulk-imported record,
// hence `aliases` being an array rather than a single string.
const EXTERNAL_COLLABORATORS: { id: string; name: string; title: string; aliases: string[]; photoUrl: string; tier: 0 | 1 | 2 }[] = [
  {
    id: "external-ms-alqahtani",
    name: "Mohammed S. Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Prof. Dr. Mohammed S. Alqahtani"],
    photoUrl: "/uploads/people/0ad3c287-190a-40a9-8fd2-2139b6ca6cdd.jpg",
    tier: 0,
  },
  {
    id: "external-fawaz-alqahtani",
    name: "Fawaz Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Dr. Fawaz Alqahtani"],
    photoUrl: "/uploads/people/e431c7cb-4560-4df6-bcf6-aa1558f5f8cb.jpg",
    tier: 0,
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

  const nodes: CollaborationNode[] = [
    ...people.map((p) => ({
      id: p.id,
      name: shortName(p.fullName),
      title: shortTitle(pickLocalized(locale, p.titleOrRole, p.titleOrRoleAr)),
      photoUrl: p.photoUrl,
      tier: TIER_OVERRIDES[p.fullName] ?? CATEGORY_TIER[p.category] ?? 1,
    })),
    ...EXTERNAL_COLLABORATORS.map((ext) => ({
      id: ext.id,
      name: ext.name,
      title: ext.title,
      photoUrl: ext.photoUrl,
      tier: ext.tier,
    })),
  ].sort((a, b) => a.tier - b.tier);

  // Within tier 0, keep the Director centered with external collaborators flanking on either side.
  const tier0 = nodes.filter((n) => n.tier === 0);
  const director = tier0.find((n) => n.name.includes("Yousef"));
  if (director && tier0.length === 3) {
    const flankers = tier0.filter((n) => n !== director);
    const orderedTier0 = [flankers[0], director, flankers[1]];
    const others = nodes.filter((n) => n.tier !== 0);
    nodes.splice(0, nodes.length, ...orderedTier0, ...others);
  }

  const edges: CollaborationEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const aAliases = aliasesById.get(nodes[i].id)!;
      const bAliases = aliasesById.get(nodes[j].id)!;
      const count = publications.filter(
        (pub) => aAliases.some((a) => pub.authors.includes(a)) && bAliases.some((b) => pub.authors.includes(b))
      ).length;
      edges.push({ fromId: nodes[i].id, toId: nodes[j].id, count });
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.collaboration.heading}</h1>
      <p className="mt-2 text-muted-foreground">{dict.collaboration.subheading}</p>

      <div className="mt-10">
        <CollaborationNetwork
          nodes={nodes}
          edges={edges}
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
  );
}
