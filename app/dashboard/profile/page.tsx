import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { PersonForm } from "@/components/person-form";
import { saveProfile } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardProfilePage() {
  const session = await requireAuth();
  const [person, { dict }] = await Promise.all([
    prisma.person.findUnique({
      where: { userId: session.user.id },
      include: { profileLinks: { orderBy: { sortOrder: "asc" } } },
    }),
    getDictionary(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{dict.dashboard.myProfile}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what appears on the public People page once an admin approves it.
      </p>
      <div className="mt-6">
        <PersonForm
          action={saveProfile}
          successMessage="Saved. Your profile is now pending admin approval."
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
                  profileLinks: person.profileLinks.map((l) => ({ label: l.label, url: l.url })),
                }
              : null
          }
        />
      </div>
    </div>
  );
}
