import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SectionNav } from "@/components/dashboard-nav";
import { getSession } from "@/lib/permissions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");
  const { dict } = await getDictionary();

  const links = [
    { href: "/dashboard", label: dict.dashboard.overview },
    { href: "/dashboard/profile", label: dict.dashboard.myProfile },
    { href: "/dashboard/projects", label: dict.dashboard.myProjects },
    { href: "/dashboard/publications", label: dict.dashboard.myPublications },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <p className="text-sm text-muted-foreground">
          {dict.dashboard.signedInAs} {session.user.email}
        </p>
        <div className="mt-3">
          <SectionNav links={links} />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
