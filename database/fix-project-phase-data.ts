// One-off data correction for three Project rows whose phase/domain tags
// were wrong in the original bulk import, fixed locally on 2026-09-02 but
// never applied anywhere `database/seed.ts` had already run — that script's
// `createMany({ skipDuplicates: true })` only inserts rows that don't exist
// yet, so re-running it after a fresh seed does NOT update rows that are
// already there. Run this once against any database that already has the
// old data (e.g. Replit's), after pulling the latest code:
//
//   npx tsx database/fix-project-phase-data.ts
//
// Safe to run more than once — each update is a no-op if already applied.
import "dotenv/config";
import { prisma } from "../lib/db";

async function main() {
  const onlyOngoing = await prisma.project.updateMany({
    where: { title: "Study of Magnetic Bioglass-Ceramics for Hyperthermia Application" },
    data: { phase: "COMPLETED" },
  });
  console.log(`Magnetic Bioglass-Ceramics -> COMPLETED: ${onlyOngoing.count} row(s) updated`);

  const plantGrowth = await prisma.project.updateMany({
    where: { title: "Strategies Application of Light Phosphors Source Use in Plant Growth" },
    data: { tags: ["sustainability"] },
  });
  console.log(`Light Phosphors / Plant Growth -> tags: [sustainability]: ${plantGrowth.count} row(s) updated`);

  const solarCells = await prisma.project.findFirst({
    where: { title: { contains: "Solar Cells" } },
    select: { id: true, tags: true },
  });
  if (solarCells) {
    await prisma.project.update({
      where: { id: solarCells.id },
      data: { tags: [...new Set([...solarCells.tags, "sustainability"])] },
    });
    console.log("Solar Cells / Clean Energy -> tags now include sustainability");
  } else {
    console.log("Solar Cells / Clean Energy project not found — skipped");
  }

  const ongoing = await prisma.project.findMany({ where: { phase: "ONGOING" }, select: { title: true } });
  console.log(`\nOngoing projects now (should be exactly 1): ${JSON.stringify(ongoing)}`);
}

main().finally(() => prisma.$disconnect());
