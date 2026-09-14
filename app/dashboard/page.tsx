import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContentStateBadge } from "@/components/status-badge";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export default async function DashboardOverviewPage() {
  const session = await requireAuth();
  const userId = session.user.id;
  const contentEnabled = session.user.role === "ADMIN" || MEMBER_CONTENT_SUBMISSIONS_ENABLED;

  const [person, projects, publications, allowedServicesCount, { locale, dict }] = await Promise.all([
    prisma.person.findUnique({ where: { userId } }),
    contentEnabled ? prisma.project.findMany({ where: { submittedById: userId }, orderBy: { createdAt: "desc" } }) : Promise.resolve([]),
    contentEnabled
      ? prisma.publication.findMany({ where: { submittedById: userId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    prisma.service.count({ where: { allowedMembers: { some: { id: userId } } } }),
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

      <Card>
        <CardHeader>
          <CardTitle>{dict.dashboard.myServices}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {allowedServicesCount > 0 ? `${allowedServicesCount} ${dict.dashboard.granted.toLowerCase()}` : dict.dashboard.noServicesGranted}
          </p>
          <Link href="/dashboard/services" className="mt-2 inline-block text-sm text-accent underline-offset-4 hover:underline">
            {dict.dashboard.manage} {locale === "ar" ? "←" : "→"}
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SubmissionSummary
          title={dict.dashboard.myProjects}
          href="/dashboard/projects"
          items={projects}
          dict={dict}
          locale={locale}
          enabled={contentEnabled}
        />
        <SubmissionSummary
          title={dict.dashboard.myPublications}
          href="/dashboard/publications"
          items={publications}
          dict={dict}
          locale={locale}
          enabled={contentEnabled}
        />
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
  enabled,
}: {
  title: string;
  href: string;
  items: { id: string; state: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED" }[];
  dict: Dictionary;
  locale: string;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{dict.dashboard.comingSoon}</p>
        </CardContent>
      </Card>
    );
  }

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
