import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { findCandidateReassignments, confirmReassignments } from "../../new/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ConfirmReassignmentsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, username: true, person: { select: { fullName: true } } },
  });
  if (!user) notFound();

  const { publications, projects } = await findCandidateReassignments(user.person?.fullName ?? user.name, userId);
  const applyReassignments = confirmReassignments.bind(null, userId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Account created for {user.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Username: <span className="font-mono">{user.username}</span>. They&rsquo;ll be asked to set a real
        email and password the first time they sign in.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Existing content that looks like theirs</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adds them as a co-owner alongside anyone else already managing it — nothing is moved or
            duplicated, and they&rsquo;ll be notified once added.
          </p>
        </CardHeader>
        <CardContent>
          {publications.length === 0 && projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Projects or Publications matched their name that they aren&rsquo;t already an owner of.
            </p>
          ) : (
            <form action={applyReassignments} className="space-y-4">
              {publications.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Publications</p>
                  <div className="mt-2 space-y-2">
                    {publications.map((p) => (
                      <label key={p.id} className="flex items-start gap-2 text-sm">
                        <input type="checkbox" name="publicationId" value={p.id} defaultChecked className="mt-1" />
                        <span>
                          {p.title} <span className="text-muted-foreground">({p.year})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {projects.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Projects</p>
                  <div className="mt-2 space-y-2">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-start gap-2 text-sm">
                        <input type="checkbox" name="projectId" value={p.id} defaultChecked className="mt-1" />
                        <span>{p.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit">Add selected as {user.name}&rsquo;s content</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
