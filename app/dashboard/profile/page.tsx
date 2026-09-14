import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { PersonForm } from "@/components/person-form";
import { saveProfile } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { AccountPanel } from "./account-panel";

export default async function DashboardProfilePage() {
  const session = await requireAuth();
  const { dict } = await getDictionary();

  if (session.user.role !== "ADMIN" && session.user.role !== "TEAM") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-primary">{dict.dashboard.myProfile}</h1>
        <div className="mt-6 max-w-md">
          <AccountPanel name={session.user.name ?? ""} email={session.user.email ?? ""} />
        </div>
      </div>
    );
  }

  const person = await prisma.person.findUnique({
    where: { userId: session.user.id },
    include: { profileLinks: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{dict.dashboard.myProfile}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {person?.state === "PUBLISHED" && session.user.role === "TEAM"
          ? "This is what appears on the public People page. Your changes go live immediately."
          : "This is what appears on the public People page once an admin approves it."}
      </p>
      <div className="mt-6">
        <PersonForm
          action={saveProfile}
          successMessage="Saved."
          defaultPerson={
            person
              ? {
                  fullName: person.fullName,
                  titleOrRole: person.titleOrRole,
                  titleOrRoleAr: person.titleOrRoleAr,
                  bio: person.bio,
                  bioAr: person.bioAr,
                  category: person.category,
                  photoUrl: person.photoUrl,
                  profileLinks: person.profileLinks.map((l) => ({ label: l.label, url: l.url, visible: l.visible })),
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
                  researchInterests: (person.researchInterests as string[] | null) ?? undefined,
                  researchInterestsAr: (person.researchInterestsAr as string[] | null) ?? undefined,
                  researchProjects: (person.researchProjects as string[] | null) ?? undefined,
                  researchProjectsAr: (person.researchProjectsAr as string[] | null) ?? undefined,
                  publications: (person.publications as { citation: string; url?: string }[] | null) ?? undefined,
                  citationCount: person.citationCount,
                  hIndex: person.hIndex,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
