"use client";

import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

export type FormLocale = "en" | "ar";

/** Form-level language switch: both English and Arabic field sets stay mounted
 * (so nothing is lost when switching back and forth and both submit with the
 * form) — this just toggles which set is visible. Leave one side blank and the
 * server auto-translates it from the other on save. */
export function LanguageTabToggle({
  value,
  onChange,
}: {
  value: FormLocale;
  onChange: (value: FormLocale) => void;
}) {
  const { dict } = useI18n();

  return (
    <div className="inline-flex rounded-lg border p-0.5">
      {(["en", "ar"] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-md px-3 py-1 text-sm font-medium transition-colors",
            value === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {tab === "en" ? dict.common.english : dict.common.arabic}
        </button>
      ))}
    </div>
  );
}
