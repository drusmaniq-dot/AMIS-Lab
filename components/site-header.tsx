"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/language-toggle";
import { useI18n } from "@/components/i18n-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

function navLinks(dict: Dictionary) {
  return [
    { href: "/", label: dict.nav.home },
    { href: "/people", label: dict.nav.people },
    { href: "/projects", label: dict.nav.projects },
    { href: "/publications", label: dict.nav.publications },
    { href: "/collaboration", label: dict.nav.collaboration },
    { href: "/digital-tools", label: dict.nav.digitalTools },
    { href: "/services", label: dict.nav.services },
    { href: "/equipment", label: dict.nav.equipment },
    { href: "/contact", label: dict.nav.contact },
  ];
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const { dict } = useI18n();
  const links = navLinks(dict);

  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 55% 90% at 50% 50%, rgba(110,170,2,0.16), rgba(110,170,2,0.06) 55%, transparent 80%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 22%, black 78%, transparent 100%)",
        }}
      />
      <div className="relative z-10 grid h-36 w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
        <Link href="/" className="shrink-0 justify-self-start">
          <Image
            src="/branding/logo.png"
            alt="AMIS Lab — Advanced Materials, Innovation & Sustainability"
            width={1712}
            height={559}
            unoptimized
            priority
            className="h-[72px] w-[220px] max-w-none shrink-0"
          />
        </Link>

        <nav className="hidden items-center justify-center gap-0.5 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-2 py-2 text-[15px] font-semibold whitespace-nowrap transition-colors hover:bg-muted hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-foreground/90"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-1.5 xl:flex">
          <LanguageToggle />
          <AuthArea session={session} status={status} dict={dict} />
        </div>

        <div className="col-start-2 col-end-4 flex items-center justify-end gap-2 xl:hidden">
          <LanguageToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="px-4 pt-4">{dict.nav.menu}</SheetTitle>
              <nav className="flex flex-col gap-1 p-4">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="mt-2 border-t pt-2">
                  <AuthArea session={session} status={status} dict={dict} stacked />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <svg
        className="relative z-10 block h-4 w-full"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="amis-header-wave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-navy)" />
            <stop offset="25%" stopColor="var(--brand-teal)" />
            <stop offset="50%" stopColor="var(--brand-red)" />
            <stop offset="75%" stopColor="var(--brand-blue)" />
            <stop offset="100%" stopColor="var(--brand-green)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#amis-header-wave)"
          d="M0,20 C120,38 240,2 360,20 C480,38 600,2 720,20 C840,38 960,2 1080,20 C1200,38 1320,2 1440,20 L1440,40 L0,40 Z"
        />
      </svg>
    </header>
  );
}

function AuthArea({
  session,
  status,
  dict,
  stacked = false,
}: {
  session: ReturnType<typeof useSession>["data"];
  status: ReturnType<typeof useSession>["status"];
  dict: Dictionary;
  stacked?: boolean;
}) {
  const wrapperClass = stacked ? "flex flex-col gap-1" : "flex items-center gap-2";

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div className={wrapperClass}>
        <Button variant="ghost" size="sm" render={<Link href="/login" />}>
          {dict.nav.login}
        </Button>
        <Button size="sm" className="ml-1" render={<Link href="/register" />}>
          {dict.nav.joinAsMember}
        </Button>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {session.user.role === "ADMIN" && (
        <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
          {dict.nav.admin}
        </Button>
      )}
      <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
        {dict.nav.dashboard}
      </Button>
      <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
        <X className="size-4" />
        {dict.nav.signOut}
      </Button>
    </div>
  );
}
