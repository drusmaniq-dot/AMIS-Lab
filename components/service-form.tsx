"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BilingualFieldSet } from "@/components/bilingual-field-set";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultService {
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  ctaLabel: string | null;
  ctaLabelAr?: string | null;
  ctaUrl: string | null;
  ctaEmail: string | null;
}

export type ServiceFormState = { error?: string } | undefined;

export function ServiceForm({
  action,
  defaultService,
}: {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  defaultService?: DefaultService;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<ServiceFormState, FormData>(action, undefined);
  const [tab, setTab] = useState<FormLocale>("en");

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{dict.common.editingLanguage}</Label>
          <LanguageTabToggle value={tab} onChange={setTab} />
        </div>
        <BilingualFieldSet
          tab={tab}
          fields={[
            { name: "title", labelEn: "Title (English)", labelAr: "العنوان (بالعربية)", defaultEn: defaultService?.title, defaultAr: defaultService?.titleAr },
            { name: "description", labelEn: "Description (English)", labelAr: "الوصف (بالعربية)", defaultEn: defaultService?.description, defaultAr: defaultService?.descriptionAr, multiline: true },
            { name: "ctaLabel", labelEn: "CTA label (English)", labelAr: "نص الدعوة لاتخاذ إجراء (بالعربية)", defaultEn: defaultService?.ctaLabel, defaultAr: defaultService?.ctaLabelAr, placeholderEn: "e.g. Request a quote" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ctaUrl">Link</Label>
          <Input id="ctaUrl" name="ctaUrl" type="url" defaultValue={defaultService?.ctaUrl ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ctaEmail">Or email</Label>
          <Input id="ctaEmail" name="ctaEmail" type="email" defaultValue={defaultService?.ctaEmail ?? ""} />
        </div>
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
