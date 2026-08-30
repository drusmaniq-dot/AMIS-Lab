"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/image-upload-field";
import { BilingualFieldSet } from "@/components/bilingual-field-set";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";
import { updateSiteSettings, type SettingsFormState } from "./actions";

interface Defaults {
  homeIntroTitle: string;
  homeIntroTitleAr?: string | null;
  homeIntroBody: string;
  homeIntroBodyAr?: string | null;
  directorName: string;
  directorMessage: string;
  directorMessageAr?: string | null;
  directorPhotoUrl: string | null;
  contactAddress: string | null;
  contactAddressAr?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  mapEmbedUrl: string | null;
}

export function SettingsForm({ defaults }: { defaults: Defaults }) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(updateSiteSettings, undefined);
  const [tab, setTab] = useState<FormLocale>("en");

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label className="text-xs text-muted-foreground">{dict.common.editingLanguage}</Label>
        <LanguageTabToggle value={tab} onChange={setTab} />
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Home intro</h2>
        <BilingualFieldSet
          tab={tab}
          fields={[
            { name: "homeIntroTitle", labelEn: "Title (English)", labelAr: "العنوان (بالعربية)", defaultEn: defaults.homeIntroTitle, defaultAr: defaults.homeIntroTitleAr },
            { name: "homeIntroBody", labelEn: "Intro text (English)", labelAr: "نص المقدمة (بالعربية)", defaultEn: defaults.homeIntroBody, defaultAr: defaults.homeIntroBodyAr, multiline: true },
          ]}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Director&apos;s message</h2>
        <div className="space-y-2">
          <Label htmlFor="directorName">Director name</Label>
          <Input id="directorName" name="directorName" required defaultValue={defaults.directorName} />
        </div>
        <BilingualFieldSet
          tab={tab}
          fields={[
            { name: "directorMessage", labelEn: "Message (English)", labelAr: "الرسالة (بالعربية)", defaultEn: defaults.directorMessage, defaultAr: defaults.directorMessageAr, multiline: true },
          ]}
        />
        <ImageUploadField name="directorPhoto" label="Director photo" currentUrl={defaults.directorPhotoUrl} />
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-primary">Contact info</h2>
        <BilingualFieldSet
          tab={tab}
          fields={[
            { name: "contactAddress", labelEn: "Address (English)", labelAr: "العنوان (بالعربية)", defaultEn: defaults.contactAddress, defaultAr: defaults.contactAddressAr, multiline: true },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={defaults.contactEmail ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input id="contactPhone" name="contactPhone" defaultValue={defaults.contactPhone ?? ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mapEmbedUrl">Map embed URL</Label>
          <Input id="mapEmbedUrl" name="mapEmbedUrl" type="url" defaultValue={defaults.mapEmbedUrl ?? ""} />
          <p className="text-xs text-muted-foreground">A Google Maps embed URL (Share → Embed a map → copy the src).</p>
        </div>
      </section>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">Saved.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
