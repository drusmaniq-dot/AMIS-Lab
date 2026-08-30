import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminOverviewPage() {
  const [pendingSignups, pendingPeople, pendingProjects, pendingPublications, unreadMessages, totalUsers, { dict }] =
    await Promise.all([
      prisma.user.count({ where: { status: "PENDING" } }),
      prisma.person.count({ where: { state: "PENDING" } }),
      prisma.project.count({ where: { state: "PENDING" } }),
      prisma.publication.count({ where: { state: "PENDING" } }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.user.count(),
      getDictionary(),
    ]);

  const pendingContent = pendingPeople + pendingProjects + pendingPublications;

  const cards = [
    { label: dict.admin.pendingSignups, value: pendingSignups, href: "/admin/signups" },
    { label: dict.admin.pendingContent, value: pendingContent, href: "/admin/content/pending" },
    { label: dict.admin.unreadMessages, value: unreadMessages, href: "/admin/contact-messages" },
    { label: dict.admin.totalUsers, value: totalUsers, href: "/admin/users" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">{dict.admin.overviewTitle}</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
