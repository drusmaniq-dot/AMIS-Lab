"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/image-upload-field";
import { BilingualFieldSet } from "@/components/bilingual-field-set";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultDigitalTool {
  title: string;
  titleAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  url: string | null;
  screenshotUrl: string | null;
}

export type DigitalToolFormState = { error?: string } | undefined;

export function DigitalToolForm({
  action,
  defaultTool,
}: {
  action: (state: DigitalToolFormState, formData: FormData) => Promise<DigitalToolFormState>;
  defaultTool?: DefaultDigitalTool;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<DigitalToolFormState, FormData>(action, undefined);
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
            { name: "title", labelEn: "Title (English)", labelAr: "العنوان (بالعربية)", defaultEn: defaultTool?.title, defaultAr: defaultTool?.titleAr },
            { name: "description", labelEn: "Description (English)", labelAr: "الوصف (بالعربية)", defaultEn: defaultTool?.description, defaultAr: defaultTool?.descriptionAr, multiline: true },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">Link</Label>
        <Input id="url" name="url" type="url" defaultValue={defaultTool?.url ?? ""} />
      </div>
      <ImageUploadField name="screenshot" label="Screenshot" currentUrl={defaultTool?.screenshotUrl} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
