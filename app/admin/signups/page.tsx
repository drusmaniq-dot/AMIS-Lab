import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveSignup, rejectSignup } from "./actions";

export default async function AdminSignupsPage() {
  const users = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Sign-up Requests</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        New accounts can&apos;t log in until you approve them.
      </p>

      {users.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No pending sign-up requests.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Requested {user.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={approveSignup.bind(null, user.id)}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={rejectSignup.bind(null, user.id)}>
                    <Button type="submit" size="sm" variant="outline" className="text-destructive">
                      Reject
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
