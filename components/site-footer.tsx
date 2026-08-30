import Link from "next/link";
import { getSocialLinks } from "@/lib/data";
import { resolveIcon } from "@/lib/social-icons";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function SiteFooter() {
  const [socialLinks, { dict }] = await Promise.all([getSocialLinks(), getDictionary()]);

  return (
    <footer className="border-t bg-brand-navy text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold">AMIS Lab</p>
          <p className="mt-1 max-w-sm text-sm text-white/70">
            {dict.footer.tagline} — {dict.footer.brands}
          </p>
          <p className="mt-1 max-w-sm text-xs text-white/50">{dict.footer.kkuAffiliation}</p>
        </div>

        {socialLinks.length > 0 && (
          <div className="flex gap-3">
            {socialLinks.map((link) => {
              const Icon = resolveIcon(link.icon ?? link.platform);
              return (
                <Link
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={link.platform}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} AMIS Lab. {dict.footer.rights}
      </div>
    </footer>
  );
}
