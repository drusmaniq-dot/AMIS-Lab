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
  // Split off tier 0 (which they used to share with Yousef in a 3-way
  // director-centering layout) so each can move independently — see the
  // matching TIER_POSITIONS entries in collaboration-network.tsx.
  "Mohammed S. Alqahtani": 0.001,
  "Fawaz Alqahtani": 0.002,
  "Manuela Reben": 0.007,
  "Rongping Wang": 0.008,
  "Essam Ramadan Shaaban": 0.009,
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
  // Research profile icons shown on the photo in the tier diagram.
  scholarUrl: string | null;
  researchGateUrl: string | null;
  tier: number;
  includeInTierDiagram: boolean;
}[] = [
  {
    id: "external-ms-alqahtani",
    name: "Mohammed S. Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Prof. Dr. Mohammed S. Alqahtani"],
    photoUrl: "/uploads/people/0ad3c287-190a-40a9-8fd2-2139b6ca6cdd.jpg",
    scholarUrl: null,
    researchGateUrl: "https://www.researchgate.net/profile/Mohammed-Alqahtani-38",
    tier: 0,
    includeInTierDiagram: true,
  },
  {
    id: "external-fawaz-alqahtani",
    name: "Fawaz Alqahtani",
    title: "Management, KKU Central Labs",
    aliases: LAB_MANAGEMENT_ALIASES["Dr. Fawaz Alqahtani"],
    photoUrl: "/uploads/people/e431c7cb-4560-4df6-bcf6-aa1558f5f8cb.jpg",
    scholarUrl: "https://scholar.google.com/citations?user=CbluL4EAAAAJ&hl=en",
    researchGateUrl: null,
    tier: 0,
    includeInTierDiagram: true,
  },
  // Verified via the actual co-authored paper (DOI 10.3390/ma15051844) —
  // Mohammed S. Alqahtani's #1 co-author by shared-paper count (9 papers).
  {
    id: "external-zahran",
    name: "Heba Y. Zahran",
    title: "King Khalid University, Saudi Arabia",
    aliases: ["HY Zahran"],
    photoUrl: null,
    scholarUrl: null,
    researchGateUrl: "https://www.researchgate.net/profile/Heba-Zahran-2",
    tier: 0.003,
    includeInTierDiagram: false,
  },
  // International co-authors, verified via OpenAlex on their actual shared
  // papers (DOI 10.3390/ma15196518, 10.1088/1748-0221/16/07/t07004) — the
  // only two of Mohammed S. Alqahtani's collaborators based outside Saudi
  // Arabia who aren't already in the diagram.
  {
    id: "external-charfi",
    name: "Bilel Charfi",
    title: "University of Sfax, Tunisia",
    aliases: ["B Charfi"],
    photoUrl: "/uploads/people/external-charfi.png",
    scholarUrl: "https://scholar.google.com/citations?user=pc2F-UUAAAAJ&hl=fr",
    researchGateUrl: null,
    tier: 0.0025,
    includeInTierDiagram: false,
  },
  {
    id: "external-grelowska",
    name: "I. Grelowska",
    title: "AGH University of Krakow, Poland",
    aliases: ["I Grelowska"],
    photoUrl: null,
    // No dedicated Scholar/ResearchGate profile found for her specifically —
    // only co-authored publications turned up in search.
    scholarUrl: null,
    researchGateUrl: null,
    tier: 0.0035,
    includeInTierDiagram: false,
  },
  // Verified on the same paper — a frequent Fawaz Alqahtani co-author from
  // his own department (Radiological Sciences) not already in the diagram.
  {
    id: "external-alzahrani",
    name: "Khloud J. Alzahrani",
    title: "King Khalid University, Saudi Arabia",
    aliases: ["KJ Alzahrani"],
    photoUrl: null,
    // No Scholar/ResearchGate profile found — only an MDPI sciprofiles page
    // (see the earlier photo-sourcing report), which isn't either network.
    scholarUrl: null,
    researchGateUrl: null,
    tier: 0.004,
    includeInTierDiagram: false,
  },
  {
    id: "external-reben",
    name: "Manuela Reben",
    title: "AGH University of Science and Technology, Poland",
    aliases: ["M Reben"],
    photoUrl: "/uploads/people/external-reben.jpg",
    scholarUrl: "https://scholar.google.com/citations?user=oaGOjiwAAAAJ&hl=en",
    researchGateUrl: "https://www.researchgate.net/profile/Manuela-Reben",
    tier: 0.1,
    includeInTierDiagram: true,
  },
  // No shared publication found on file or on his Google Scholar profile —
  // shown with a manually asserted connection to the Director (see
  // MANUAL_EDGES below) rather than a real computed co-authorship count.
  {
    id: "external-wang",
    name: "Rongping Wang",
    title: "Ningbo University, China",
    aliases: [],
    photoUrl: "/uploads/people/external-wang.jpg",
    // Couldn't confirm a personal Scholar profile with certainty (name
    // collides with unrelated researchers elsewhere) — this ResearchGate
    // link is the auto-generated publication-list page, not a personal one.
    scholarUrl: null,
    researchGateUrl: "https://www.researchgate.net/scientific-contributions/Rongping-Wang-2034418478",
    tier: 0.1,
    includeInTierDiagram: true,
  },
  {
    id: "external-shaaban",
    name: "Essam Ramadan Shaaban",
    title: "Al-Azhar University, Egypt",
    aliases: ["ER Shaaban"],
    photoUrl: "/uploads/people/external-shaaban.webp",
    scholarUrl: "https://scholar.google.com/citations?user=YK6DV-IAAAAJ",
    researchGateUrl: "https://www.researchgate.net/profile/Essam-Shaaban",
    tier: 0.1,
    includeInTierDiagram: true,
  },
  // No shared publication found on file — manually asserted connection to
  // the Director (see MANUAL_EDGES below), same as Rongping Wang above.
  {
    id: "external-murugan",
    name: "Ganapathy Senthil Murugan",
    title: "University of Southampton, United Kingdom",
    aliases: [],
    photoUrl: "/uploads/people/external-murugan.png",
    scholarUrl: "https://scholar.google.com/citations?user=Yt6C0dwAAAAJ&hl=en",
    researchGateUrl: "https://www.researchgate.net/profile/Ganapathy-Senthil-Murugan",
    tier: 0.08,
    includeInTierDiagram: true,
  },
  {
    id: "external-aly",
    name: "Kamal A. Aly",
    title: "University of Jeddah, Saudi Arabia",
    aliases: ["KA Aly"],
    photoUrl: "/uploads/people/external-aly.png",
    scholarUrl: "https://scholar.google.com/citations?user=CUJhhWMAAAAJ&hl=en",
    researchGateUrl: null,
    tier: 0.9,
    includeInTierDiagram: false,
  },
  {
    id: "external-mehta",
    name: "Neeraj Mehta",
    title: "Banaras Hindu University, India",
    aliases: ["N Mehta"],
    photoUrl: "/uploads/people/external-mehta.png",
    scholarUrl: "https://scholar.google.com/citations?user=2yXZa5MAAAAJ&hl=en",
    researchGateUrl: "https://www.researchgate.net/profile/Neeraj-Mehta-2",
    tier: 1.3,
    includeInTierDiagram: false,
  },
  {
    id: "external-mohamed",
    name: "Ehab Mahmoud Mohamed",
    title: "Prince Sattam Bin Abdulaziz University, Saudi Arabia",
    aliases: ["EM Mohamed"],
    photoUrl: "/uploads/people/external-mohamed.png",
    scholarUrl: "https://scholar.google.com/citations?user=6Do0A98AAAAJ&hl=en",
    researchGateUrl: "https://www.researchgate.net/profile/Ehab-Mohamed-2",
    tier: 1.1,
    includeInTierDiagram: false,
  },
  {
    id: "external-ismeil",
    name: "Mohamed A. Ismeil",
    title: "King Khalid University",
    aliases: ["MA Ismeil"],
    photoUrl: "/uploads/people/external-ismeil.png",
    scholarUrl: "https://scholar.google.com/citations?user=CaQNGjcAAAAJ&hl=en",
    researchGateUrl: null,
    tier: 1.7,
    includeInTierDiagram: false,
  },
  // Both verified via Abdulaziz Ahmed Hadi Asiri's only paper on file (DOI
  // 10.69626/sag.2025.0207, confirmed via OpenAlex — all three at King
  // Khalid University). "AM Alshehri" is the same person's other byline,
  // appearing on 11 further papers with no overlap with "Ali M. Alshehri".
  {
    id: "external-akram-ibrahim",
    name: "Akram Ibrahim",
    title: "King Khalid University, Saudi Arabia",
    aliases: ["A. Ibrahim"],
    photoUrl: "/uploads/people/external-akram-ibrahim.jpg",
    scholarUrl: null,
    researchGateUrl: "https://www.researchgate.net/profile/Akram-Ibrahim-17",
    tier: 1.95,
    includeInTierDiagram: false,
  },
  {
    id: "external-ali-alshehri",
    name: "Ali M. Alshehri",
    title: "King Khalid University, Saudi Arabia",
    aliases: ["Ali M. Alshehri", "AM Alshehri"],
    photoUrl: "/uploads/people/external-ali-alshehri.webp",
    scholarUrl: null,
    researchGateUrl: "https://www.researchgate.net/profile/Ali-Alshehri-13",
    tier: 2.05,
    includeInTierDiagram: false,
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

  // Pull each real Person's own Scholar/ResearchGate links straight from
  // their existing ProfileLink rows (People page data) rather than
  // duplicating them in code here — this is the single source of truth.
  const profileLinks = await prisma.profileLink.findMany({
    where: { personId: { in: people.map((p) => p.id) } },
  });
  const scholarByPersonId = new Map<string, string>();
  const researchGateByPersonId = new Map<string, string>();
  for (const link of profileLinks) {
    const label = link.label.toLowerCase();
    if (label.includes("scholar")) scholarByPersonId.set(link.personId, link.url);
    else if (label.includes("researchgate")) researchGateByPersonId.set(link.personId, link.url);
  }

  const aliasesById = new Map<string, string[]>();
  for (const p of people) aliasesById.set(p.id, [AUTHOR_ALIASES[p.fullName]]);
  for (const ext of EXTERNAL_COLLABORATORS) aliasesById.set(ext.id, ext.aliases);

  // Full entity list — every Person plus every external collaborator, real name
  // preserved (not yet tier-sorted or shortened) — the shared basis for both the
  // tier diagram (a filtered subset) and the globe (everyone).
  type Entity = {
    id: string;
    fullName: string;
    name: string;
    title: string;
    photoUrl: string | null;
    scholarUrl: string | null;
    researchGateUrl: string | null;
    tier: number;
    includeInTierDiagram: boolean;
  };
  const allEntities: Entity[] = [
    ...people.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      name: shortName(p.fullName),
      title: shortTitle(pickLocalized(locale, p.titleOrRole, p.titleOrRoleAr)),
      photoUrl: p.photoUrl,
      scholarUrl: scholarByPersonId.get(p.id) ?? null,
      researchGateUrl: researchGateByPersonId.get(p.id) ?? null,
      tier: TIER_OVERRIDES[p.fullName] ?? CATEGORY_TIER[p.category] ?? 1,
      includeInTierDiagram: true,
    })),
    ...EXTERNAL_COLLABORATORS.map((ext) => ({
      id: ext.id,
      fullName: ext.name,
      name: ext.name,
      title: ext.title,
      photoUrl: ext.photoUrl,
      scholarUrl: ext.scholarUrl,
      researchGateUrl: ext.researchGateUrl,
      tier: TIER_OVERRIDES[ext.name] ?? ext.tier,
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
    .map((e) => ({
      id: e.id,
      name: e.name,
      title: e.title,
      photoUrl: e.photoUrl,
      scholarUrl: e.scholarUrl,
      researchGateUrl: e.researchGateUrl,
      tier: e.tier,
    }))
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

  // Manually asserted connections for collaborators with no shared
  // publication on file (Wang, Murugan) — colored via a chosen VALUE_BINS
  // range but with the numeric badge hidden, since there's no real
  // co-authorship count behind them, unlike every other edge in the diagram.
  const yousefEntity = allEntities.find((e) => e.fullName.includes("Yousef"));
  const MANUAL_EDGES: CollaborationEdge[] = yousefEntity
    ? [
        { fromId: "external-murugan", toId: yousefEntity.id, count: 38 }, // red, 34–40 bin
        { fromId: "external-wang", toId: yousefEntity.id, count: 20 }, // green, 16–25 bin
      ]
    : [];
  tierEdges.push(...MANUAL_EDGES);
  const hideCountKeys = new Set(MANUAL_EDGES.map((e) => `${e.fromId}-${e.toId}`));

  // Asiri↔Akram Ibrahim is real but weak (1 shared paper) — the fade-by-count
  // system would otherwise render it almost invisibly, so it's exempted.
  const asiriEntity = allEntities.find((e) => e.fullName.includes("Asiri"));
  const forceVisibleKeys = asiriEntity ? new Set([`${asiriEntity.id}-external-akram-ibrahim`]) : undefined;

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
    <div className="mx-auto max-w-7xl px-4 py-16">
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
        <div className="mt-6">
          <CollaborationNetwork
            nodes={tierNodes}
            edges={tierEdges}
            hideCountKeys={hideCountKeys}
            forceVisibleKeys={forceVisibleKeys}
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
