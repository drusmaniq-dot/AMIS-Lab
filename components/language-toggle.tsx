"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n-provider";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/config";

export function LanguageToggle() {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = locale === "en" ? "ar" : "en";
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={toggle}
      disabled={pending}
      aria-label="Toggle language"
      className="gap-1.5"
    >
      <Languages className="size-4" />
      {locale === "en" ? "العربية" : "English"}
    </Button>
  );
}
