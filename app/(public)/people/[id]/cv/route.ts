import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { CvDocument, type CvPersonData } from "@/lib/cv-pdf";
import type { PublicationValue } from "@/lib/person-cv-helpers";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.person.findFirst({ where: { id, state: "PUBLISHED" } });
  if (!person) return new NextResponse("Not found", { status: 404 });

  const data: CvPersonData = {
    fullName: person.fullName,
    titleOrRole: person.titleOrRole,
    academicDegree: person.academicDegree,
    email: person.email,
    phone: person.phone,
    address: person.address,
    discipline: person.discipline,
    subdiscipline: person.subdiscipline,
    researchInterests: (person.researchInterests as unknown as string[] | null) ?? null,
    researchProjects: (person.researchProjects as unknown as string[] | null) ?? null,
    publications: (person.publications as unknown as PublicationValue[] | null) ?? null,
    photoUrl: person.photoUrl,
  };

  const buffer = await renderToBuffer(await CvDocument({ person: data }));
  const fileName = `${person.fullName.replace(/[^a-z0-9]+/gi, "-")}-CV.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
