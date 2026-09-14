import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { TeamAccountForm } from "./team-account-form";

export default async function NewTeamAccountPage() {
  await requireAdmin();

  const unlinkedPeople = await prisma.person.findMany({
    where: { userId: null },
    select: { id: true, fullName: true, category: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Add Team Member</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Creates a login for one of the people already listed on the site. They&rsquo;ll sign in with the
        username and temporary password below, then set their own real email and password.
      </p>

      {unlinkedPeople.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Every listed person already has an account. Add a new person under Content &rsquo; People first.
        </p>
      ) : (
        <div className="mt-6 max-w-md">
          <TeamAccountForm people={unlinkedPeople} />
        </div>
      )}
    </div>
  );
}
