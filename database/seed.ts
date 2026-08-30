// Restores the real AMIS Lab content (people, projects, publications, equipment,
// etc.) from the JSON snapshots in database/data/ into a freshly migrated,
// empty database — e.g. after `prisma migrate deploy` on a new deployment.
//
// Usage:
//   DATABASE_URL=... npx tsx database/seed.ts
//
// Safe to re-run: every insert uses skipDuplicates/upsert on the original ids,
// so running it twice against the same database is a no-op the second time.

import { prisma } from "../lib/db";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "data");

function load<T>(name: string): T[] {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

// Recursively parse ISO-8601-looking strings back into Date objects — JSON has
// no native Date type, so every DateTime field round-tripped through the JSON
// export as a plain string.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function reviveDates<T>(value: T): T {
  if (typeof value === "string" && ISO_DATE_RE.test(value)) {
    return new Date(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(reviveDates) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = reviveDates(v);
    return out as T;
  }
  return value;
}

async function main() {
  const users = reviveDates(load<any>("users"));
  const people = reviveDates(load<any>("people"));
  const profileLinks = reviveDates(load<any>("profileLinks"));
  const projects = reviveDates(load<any>("projects"));
  const publications = reviveDates(load<any>("publications"));
  const digitalTools = reviveDates(load<any>("digitalTools"));
  const services = reviveDates(load<any>("services"));
  const equipment = reviveDates(load<any>("equipment"));
  const socialLinks = reviveDates(load<any>("socialLinks"));
  const homeMedia = reviveDates(load<any>("homeMedia"));
  const siteSettings = reviveDates(load<any>("siteSettings"));

  // Insertion order respects foreign keys: Users before Person/Project/Publication
  // (submittedBy/reviewedBy), Person before ProfileLink (personId).
  if (users.length) {
    await prisma.user.createMany({ data: users, skipDuplicates: true });
    console.log(`Users: ${users.length}`);
  }
  if (people.length) {
    await prisma.person.createMany({ data: people, skipDuplicates: true });
    console.log(`People: ${people.length}`);
  }
  if (profileLinks.length) {
    await prisma.profileLink.createMany({ data: profileLinks, skipDuplicates: true });
    console.log(`Profile links: ${profileLinks.length}`);
  }
  if (projects.length) {
    await prisma.project.createMany({ data: projects, skipDuplicates: true });
    console.log(`Projects: ${projects.length}`);
  }
  if (publications.length) {
    await prisma.publication.createMany({ data: publications, skipDuplicates: true });
    console.log(`Publications: ${publications.length}`);
  }
  if (digitalTools.length) {
    await prisma.digitalTool.createMany({ data: digitalTools, skipDuplicates: true });
    console.log(`Digital tools: ${digitalTools.length}`);
  }
  if (services.length) {
    await prisma.service.createMany({ data: services, skipDuplicates: true });
    console.log(`Services: ${services.length}`);
  }
  if (equipment.length) {
    await prisma.equipment.createMany({ data: equipment, skipDuplicates: true });
    console.log(`Equipment: ${equipment.length}`);
  }
  if (socialLinks.length) {
    await prisma.socialLink.createMany({ data: socialLinks, skipDuplicates: true });
    console.log(`Social links: ${socialLinks.length}`);
  }
  if (homeMedia.length) {
    await prisma.homeMedia.createMany({ data: homeMedia, skipDuplicates: true });
    console.log(`Home media: ${homeMedia.length}`);
  }
  for (const settings of siteSettings) {
    await prisma.siteSettings.upsert({ where: { id: settings.id }, update: settings, create: settings });
  }
  if (siteSettings.length) console.log(`Site settings: ${siteSettings.length}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
