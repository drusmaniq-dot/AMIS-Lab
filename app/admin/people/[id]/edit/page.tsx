import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PersonForm } from "@/components/person-form";
import type { PublicationValue } from "@/components/publications-editor";
import { adminUpdatePerson } from "../../actions";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: { profileLinks: { orderBy: { sortOrder: "asc" } } },
  });
  if (!person) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Person</h1>
      <div className="mt-6">
        <PersonForm
          action={adminUpdatePerson.bind(null, id)}
          successMessage="Saved."
          defaultPerson={{
            fullName: person.fullName,
            titleOrRole: person.titleOrRole,
            titleOrRoleAr: person.titleOrRoleAr,
            bio: person.bio,
            bioAr: person.bioAr,
            category: person.category,
            photoUrl: person.photoUrl,
            profileLinks: person.profileLinks.map((l) => ({ label: l.label, url: l.url })),
            cvUrl: person.cvUrl,
            academicDegree: person.academicDegree,
            academicDegreeAr: person.academicDegreeAr,
            email: person.email,
            phone: person.phone,
            address: person.address,
            addressAr: person.addressAr,
            discipline: person.discipline,
            disciplineAr: person.disciplineAr,
            subdiscipline: person.subdiscipline,
            subdisciplineAr: person.subdisciplineAr,
            researchInterests: (person.researchInterests as unknown as string[] | null) ?? [],
            researchInterestsAr: (person.researchInterestsAr as unknown as string[] | null) ?? [],
            researchProjects: (person.researchProjects as unknown as string[] | null) ?? [],
            researchProjectsAr: (person.researchProjectsAr as unknown as string[] | null) ?? [],
            publications: (person.publications as unknown as PublicationValue[] | null) ?? [],
            citationCount: person.citationCount,
            hIndex: person.hIndex,
          }}
        />
      </div>
    </div>
  );
}
