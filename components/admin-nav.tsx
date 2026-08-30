"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function sections(dict: Dictionary): { title: string; links: { href: string; label: string }[] }[] {
  return [
    {
      title: dict.admin.sectionOverview,
      links: [{ href: "/admin", label: dict.admin.dashboard }],
    },
    {
      title: dict.admin.sectionApprovals,
      links: [
        { href: "/admin/signups", label: dict.admin.signupRequests },
        { href: "/admin/content/pending", label: dict.admin.pendingContent },
      ],
    },
    {
      title: dict.admin.sectionContent,
      links: [
        { href: "/admin/people", label: dict.admin.people },
        { href: "/admin/projects", label: dict.admin.projects },
        { href: "/admin/publications", label: dict.admin.publications },
        { href: "/admin/digital-tools", label: dict.admin.digitalTools },
        { href: "/admin/services", label: dict.admin.services },
        { href: "/admin/equipment", label: dict.admin.equipment },
      ],
    },
    {
      title: dict.admin.sectionSite,
      links: [
        { href: "/admin/settings", label: dict.admin.homeAndDirector },
        { href: "/admin/social-links", label: dict.admin.socialLinks },
        { href: "/admin/home-media", label: dict.admin.homeMedia },
        { href: "/admin/contact-messages", label: dict.admin.contactMessages },
      ],
    },
    {
      title: dict.admin.sectionUsers,
      links: [{ href: "/admin/users", label: dict.admin.userManagement }],
    },
  ];
}

export function AdminNav() {
  const pathname = usePathname();
  const { dict } = useI18n();

  return (
    <nav className="space-y-6">
      {sections(dict).map((section) => (
        <div key={section.title}>
          <p className="px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {section.title}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {section.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
