import { prisma } from "@/lib/db";
import { AUTHOR_ALIASES } from "@/lib/author-aliases";
import { pickLocalized, type Locale } from "@/lib/i18n/config";

export interface GraphNode {
  id: string;
  name: string;
  title: string | null;
  photoUrl: string | null;
  isLabMember: boolean;
  publicationCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

export interface CollaborationGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// Frequent-collaborator threshold — external co-authors need more than this many
// shared publications with the lab to be included as a node. Keeps the graph to a
// legible size instead of ~1200 one-off names.
const MIN_SHARED_PUBLICATIONS = 5;

export async function getCollaborationGraphData(locale: Locale): Promise<CollaborationGraphData> {
  const [publications, people] = await Promise.all([
    prisma.publication.findMany({ where: { state: "PUBLISHED" }, select: { authors: true } }),
    prisma.person.findMany({
      where: { state: "PUBLISHED", fullName: { in: Object.keys(AUTHOR_ALIASES) } },
      select: { fullName: true, titleOrRole: true, titleOrRoleAr: true, photoUrl: true },
    }),
  ]);

  const labAliasToPerson = new Map(people.map((p) => [AUTHOR_ALIASES[p.fullName], p]));
  const labAliases = new Set(labAliasToPerson.keys());

  // Count publications per external author to find frequent collaborators.
  const externalCounts = new Map<string, number>();
  for (const pub of publications) {
    for (const author of pub.authors) {
      if (labAliases.has(author)) continue;
      externalCounts.set(author, (externalCounts.get(author) ?? 0) + 1);
    }
  }
  const frequentExternals = new Set(
    [...externalCounts.entries()].filter(([, count]) => count > MIN_SHARED_PUBLICATIONS).map(([name]) => name)
  );

  const nodeIds = new Set<string>([...labAliases, ...frequentExternals]);

  // Build weighted edges: any two included nodes that co-author a publication together.
  const edgeWeights = new Map<string, number>();
  for (const pub of publications) {
    const relevant = pub.authors.filter((a) => nodeIds.has(a));
    for (let i = 0; i < relevant.length; i++) {
      for (let j = i + 1; j < relevant.length; j++) {
        const key = [relevant[i], relevant[j]].sort().join("::");
        edgeWeights.set(key, (edgeWeights.get(key) ?? 0) + 1);
      }
    }
  }

  const pubCountByNode = new Map<string, number>();
  for (const pub of publications) {
    for (const author of pub.authors) {
      if (!nodeIds.has(author)) continue;
      pubCountByNode.set(author, (pubCountByNode.get(author) ?? 0) + 1);
    }
  }

  const nodes: GraphNode[] = [...nodeIds].map((id) => {
    const person = labAliasToPerson.get(id);
    if (person) {
      return {
        id,
        name: person.fullName,
        title: pickLocalized(locale, person.titleOrRole, person.titleOrRoleAr),
        photoUrl: person.photoUrl,
        isLabMember: true,
        publicationCount: pubCountByNode.get(id) ?? 0,
      };
    }
    return {
      id,
      name: id,
      title: null,
      photoUrl: null,
      isLabMember: false,
      publicationCount: pubCountByNode.get(id) ?? 0,
    };
  });

  const links: GraphLink[] = [...edgeWeights.entries()].map(([key, weight]) => {
    const [source, target] = key.split("::");
    return { source, target, weight };
  });

  return { nodes, links };
}
