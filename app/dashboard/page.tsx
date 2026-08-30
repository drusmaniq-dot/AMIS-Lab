import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentStateBadge } from "@/components/status-badge";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export default async function DashboardOverviewPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [person, projects, publications, { locale, dict }] = await Promise.all([
    prisma.person.findUnique({ where: { userId } }),
    prisma.project.findMany({ where: { submittedById: userId }, orderBy: { createdAt: "desc" } }),
    prisma.publication.findMany({ where: { submittedById: userId }, orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">
        {dict.dashboard.welcome}, {session.user.name}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.myProfile}</CardTitle>
        </CardHeader>
        <CardContent>
          {person ? (
            <div className="flex items-center gap-3">
              <ContentStateBadge state={person.state} />
              <span className="text-sm text-muted-foreground">
                {person.state === "PENDING"
                  ? dict.dashboard.profileAwaiting
                  : person.state === "PUBLISHED"
                    ? dict.dashboard.profileLive
                    : dict.dashboard.profileNeedsAttention}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {dict.dashboard.noProfileYet}{" "}
              <Link href="/dashboard/profile" className="text-accent underline-offset-4 hover:underline">
                {dict.dashboard.createItNow}
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SubmissionSummary title={dict.dashboard.myProjects} href="/dashboard/projects" items={projects} dict={dict} locale={locale} />
        <SubmissionSummary title={dict.dashboard.myPublications} href="/dashboard/publications" items={publications} dict={dict} locale={locale} />
      </div>
    </div>
  );
}

function SubmissionSummary({
  title,
  href,
  items,
  dict,
  locale,
}: {
  title: string;
  href: string;
  items: { id: string; state: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" }[];
  dict: Dictionary;
  locale: string;
}) {
  const pending = items.filter((i) => i.state === "PENDING").length;
  const published = items.filter((i) => i.state === "PUBLISHED").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {items.length} {dict.dashboard.total} · {published} {dict.dashboard.published} · {pending}{" "}
          {dict.dashboard.pending}
        </p>
        <Link href={href} className="mt-2 inline-block text-sm text-accent underline-offset-4 hover:underline">
          {dict.dashboard.manage} {locale === "ar" ? "←" : "→"}
        </Link>
      </CardContent>
    </Card>
  );
}
