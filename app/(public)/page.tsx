import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getSiteSettings, getHomeMedia } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeroGraphics } from "@/components/hero-graphics";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Hand-picked, verified-relevant publications for each research domain card below.
// IDs are stable cuids from the existing publications table.
const DOMAIN_PUBLICATION_IDS: Record<string, string[]> = {
  optic: ["cmt5rmd5h001qnguz46s9ygkg", "cmt8djbh1005vckuz5edcins6"],
  shielding: ["cmt8c1diq000go8uzue0stuxd", "cmt8djbr200b9ckuzr2zindb2"],
  bio: ["cmt8c1dkg0012o8uz1jgxls4j", "cmt8djbe7004ockuzhi0g3ip6"],
  sustainability: ["cmt8djbpv00aickuzniqrz8za", "cmt8c1dle001ho8uz2u85oj4q"],
};

function SustainabilityIcon() {
  return (
    <svg viewBox="0 0 64 64" className="size-8" aria-hidden="true">
      <path
        d="M32 56 C32 40 42 28 56 24 C52 38 46 48 32 56 Z"
        fill="#6eaa02"
        fillOpacity="0.18"
        stroke="#6eaa02"
        strokeWidth="3"
      />
      <path d="M32 56 C34 44 42 34 52 27" fill="none" stroke="#6eaa02" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 44 L32 44" stroke="#6eaa02" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function domainList(dict: Dictionary) {
  return [
    {
      key: "optic",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-optic.png" alt="" className="h-9 w-auto" />,
      title: dict.home.domainOpticTitle,
      body: dict.home.domainOpticBody,
      accent: "#c82c39",
      tint: "#FBEFEF",
    },
    {
      key: "shielding",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-shielding.png" alt="" className="h-9 w-auto" />,
      title: dict.home.domainShieldingTitle,
      body: dict.home.domainShieldingBody,
      accent: "#1c66a1",
      tint: "#EEF4FA",
    },
    {
      key: "bio",
      // eslint-disable-next-line @next/next/no-img-element
      icon: <img src="/branding/icon-bio.png" alt="" className="h-9 w-auto" />,
      title: dict.home.domainBioTitle,
      body: dict.home.domainBioBody,
      accent: "#10a2a4",
      tint: "#EAF7F7",
    },
    {
      key: "sustainability",
      icon: <SustainabilityIcon />,
      title: dict.home.domainSustainabilityTitle,
      body: dict.home.domainSustainabilityBody,
      accent: "#6eaa02",
      tint: "#F3F8EC",
    },
  ];
}

// Decorative, non-content lab photography anchored to the left/right gutters,
// faded toward the page center and toward top/bottom via a radial mask — ambient
// texture behind the hero + domains area, not part of the reading column.
const SIDE_PHOTOS = [
  { src: "/lab/instrumentation-bench.jpeg", side: "left" as const, top: "9rem", size: "34rem" },
  { src: "/lab/synthesis-bench.jpeg", side: "left" as const, top: "48rem", size: "32rem" },
  { src: "/lab/plant-growth-chamber.jpeg", side: "right" as const, top: "10rem", size: "34rem" },
  { src: "/lab/lab-overview.jpeg", side: "right" as const, top: "49rem", size: "32rem" },
];

function SidePhotos() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden overflow-hidden lg:block">
      {SIDE_PHOTOS.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={p.src}
          alt=""
          className="absolute object-cover opacity-[0.65]"
          style={{
            [p.side]: `-6rem`,
            top: p.top,
            width: p.size,
            height: p.size,
            maskImage: `radial-gradient(ellipse 56% 44% at ${p.side === "left" ? "42%" : "58%"} 50%, black 30%, transparent 86%)`,
            WebkitMaskImage: `radial-gradient(ellipse 56% 44% at ${p.side === "left" ? "42%" : "58%"} 50%, black 30%, transparent 86%)`,
          }}
        />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const allDomainPubIds = Object.values(DOMAIN_PUBLICATION_IDS).flat();
  const [settings, media, { locale, dict }, domainPubs] = await Promise.all([
    getSiteSettings(),
    getHomeMedia(),
    getDictionary(),
    prisma.publication.findMany({
      where: { id: { in: allDomainPubIds } },
      select: { id: true, title: true, venue: true, year: true },
    }),
  ]);
  const pubById = new Map(domainPubs.map((p) => [p.id, p]));

  const introTitle = pickLocalized(locale, settings.homeIntroTitle, settings.homeIntroTitleAr);
  const introBody = pickLocalized(locale, settings.homeIntroBody, settings.homeIntroBodyAr);
  const directorMessage = pickLocalized(locale, settings.directorMessage, settings.directorMessageAr);

  return (
    <div>
      <div className="relative overflow-hidden">
        <SidePhotos />

        <section className="relative bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 65% 80% at 50% 40%, rgba(16,162,164,0.10), rgba(110,170,2,0.05) 55%, transparent 80%)",
            }}
          />
          <HeroGraphics />
          <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
            <h1>
              <span className="sr-only">{introTitle}</span>
              <Image
                src="/branding/hero-lockup.png"
                alt="AMIS Lab — Advanced Materials, Innovation & Sustainability"
                width={1132}
                height={506}
                unoptimized
                priority
                className="mx-auto h-24 w-auto sm:h-32"
                aria-hidden="true"
              />
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/80 whitespace-pre-line">{introBody}</p>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-primary">{dict.home.domainsHeading}</h2>
          <p className="mt-2 text-muted-foreground">{dict.home.domainsSubheading}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {domainList(dict).map((domain) => {
              const pubs = DOMAIN_PUBLICATION_IDS[domain.key].map((id) => pubById.get(id)).filter((p) => !!p);
              return (
                <div
                  key={domain.key}
                  className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ backgroundColor: domain.tint, borderColor: `${domain.accent}2a` }}
                >
                  <div className="relative z-10 flex h-full flex-col p-6">
                    <div
                      className="flex size-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                    >
                      {domain.icon}
                    </div>
                    <p className="mt-4 text-xl font-bold" style={{ color: domain.accent }}>
                      {domain.title}
                    </p>
                    <p className="mt-2 flex-1 text-sm text-foreground/75">{domain.body}</p>
                    {pubs.length > 0 && (
                      <div className="mt-4 border-t pt-4" style={{ borderColor: `${domain.accent}2a` }}>
                        <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: domain.accent }}>
                          {dict.home.relatedResearch}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                          {pubs.map((p) => (
                            <li key={p.id} className="text-xs text-muted-foreground">
                              <Link href="/publications" className="font-medium text-foreground hover:underline">
                                {p.title}
                              </Link>
                              {" — "}
                              {p.venue}, {p.year}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-primary">{dict.missionVision.heading}</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">{dict.missionVision.subheading}</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Card className="border-s-4 border-s-primary">
              <CardContent className="p-6">
                <p className="text-xs font-semibold tracking-wide text-primary uppercase">{dict.missionVision.visionLabel}</p>
                <p className="mt-2 text-foreground/85">{dict.missionVision.visionText}</p>
              </CardContent>
            </Card>
            <Card className="border-s-4 border-s-accent">
              <CardContent className="p-6">
                <p className="text-xs font-semibold tracking-wide text-accent uppercase">{dict.missionVision.missionLabel}</p>
                <p className="mt-2 text-foreground/85">{dict.missionVision.missionText}</p>
              </CardContent>
            </Card>
          </div>

          <h3 className="mt-12 text-lg font-bold text-primary">{dict.missionVision.obeHeading}</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm font-semibold text-primary">{dict.missionVision.peoLabel}</p>
              <ol className="mt-3 space-y-2.5">
                {[dict.missionVision.peo1, dict.missionVision.peo2, dict.missionVision.peo3, dict.missionVision.peo4].map(
                  (text, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      {text}
                    </li>
                  )
                )}
              </ol>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <p className="text-sm font-semibold text-accent">{dict.missionVision.soLabel}</p>
              <ol className="mt-3 space-y-2.5">
                {[dict.missionVision.so1, dict.missionVision.so2, dict.missionVision.so3, dict.missionVision.so4].map(
                  (text, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                        {i + 1}
                      </span>
                      {text}
                    </li>
                  )
                )}
              </ol>
            </div>
          </div>

          <h3 className="mt-12 text-lg font-bold text-primary">{dict.missionVision.v2030Heading}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{dict.missionVision.v2030Subheading}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { tag: dict.missionVision.v2030Pillar1Tag, title: dict.missionVision.v2030Pillar1Title, body: dict.missionVision.v2030Pillar1Body },
              { tag: dict.missionVision.v2030Pillar2Tag, title: dict.missionVision.v2030Pillar2Title, body: dict.missionVision.v2030Pillar2Body },
              { tag: dict.missionVision.v2030Pillar3Tag, title: dict.missionVision.v2030Pillar3Title, body: dict.missionVision.v2030Pillar3Body },
            ].map((pillar, i) => (
              <div key={i} className="rounded-lg border border-s-4 border-s-secondary bg-card p-5">
                <Badge variant="secondary">{pillar.tag}</Badge>
                <p className="mt-2 font-semibold text-primary">{pillar.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-12 text-lg font-bold text-primary">{dict.missionVision.sdgHeading}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{dict.missionVision.sdgSubheading}</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: dict.missionVision.sdg3Title, body: dict.missionVision.sdg3Body, color: "#c82c39" },
              { title: dict.missionVision.sdg4Title, body: dict.missionVision.sdg4Body, color: "#1c66a1" },
              { title: dict.missionVision.sdg7Title, body: dict.missionVision.sdg7Body, color: "#6eaa02" },
              { title: dict.missionVision.sdg9Title, body: dict.missionVision.sdg9Body, color: "#10a2a4" },
              { title: dict.missionVision.sdg12Title, body: dict.missionVision.sdg12Body, color: "#001041" },
              { title: dict.missionVision.sdg13Title, body: dict.missionVision.sdg13Body, color: "#6eaa02" },
            ].map((sdg, i) => (
              <div key={i} className="rounded-lg border bg-card p-4" style={{ borderInlineStartWidth: 4, borderInlineStartColor: sdg.color }}>
                <p className="text-sm font-semibold" style={{ color: sdg.color }}>
                  {sdg.title}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{sdg.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {media.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-primary">{dict.home.media}</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) => {
              const caption = pickLocalized(locale, item.caption, item.captionAr);
              return (
                <Card key={item.id} className="overflow-hidden py-0">
                  <CardContent className="p-0">
                    {item.type === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={caption}
                        loading="lazy"
                        className="aspect-video w-full object-cover"
                      />
                    ) : (
                      <iframe
                        src={item.url}
                        title={caption || "AMIS Lab video"}
                        allowFullScreen
                        className="aspect-video w-full"
                      />
                    )}
                    {caption && <p className="p-3 text-sm text-muted-foreground">{caption}</p>}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-2xl font-bold text-primary">{dict.home.directorsMessage}</h2>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row">
            {settings.directorPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.directorPhotoUrl}
                alt={settings.directorName}
                className="size-32 shrink-0 rounded-full object-cover"
              />
            )}
            <div>
              <p className="whitespace-pre-line text-muted-foreground">{directorMessage}</p>
              <p className="mt-4 font-semibold text-primary">{settings.directorName}</p>
              <p className="text-sm text-muted-foreground">{dict.home.directorRole}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
