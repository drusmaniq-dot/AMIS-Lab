"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultPublication {
  title: string;
  titleAr?: string | null;
  authors: string[];
  venue: string;
  year: number;
  type: string;
  doiOrLink: string | null;
  abstract: string | null;
  abstractAr?: string | null;
}

export type PublicationFormState = { error?: string } | undefined;

export function PublicationForm({
  action,
  defaultPublication,
}: {
  action: (state: PublicationFormState, formData: FormData) => Promise<PublicationFormState>;
  defaultPublication?: DefaultPublication;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<PublicationFormState, FormData>(action, undefined);
  const [tab, setTab] = useState<FormLocale>("en");

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{dict.common.editingLanguage}</Label>
          <LanguageTabToggle value={tab} onChange={setTab} />
        </div>

        <div className={tab === "en" ? "space-y-4" : "hidden space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="title">Title (English)</Label>
            <Input id="title" name="title" defaultValue={defaultPublication?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract (English)</Label>
            <Textarea id="abstract" name="abstract" rows={4} defaultValue={defaultPublication?.abstract ?? ""} />
          </div>
        </div>

        <div className={tab === "ar" ? "space-y-4" : "hidden space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="titleAr">العنوان (بالعربية)</Label>
            <Input id="titleAr" name="titleAr" dir="rtl" defaultValue={defaultPublication?.titleAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="abstractAr">الملخص (بالعربية)</Label>
            <Textarea id="abstractAr" name="abstractAr" dir="rtl" rows={4} defaultValue={defaultPublication?.abstractAr ?? ""} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="authors">Authors</Label>
        <Input
          id="authors"
          name="authors"
          placeholder="Comma-separated, e.g. J. Doe, A. Smith"
          required
          defaultValue={defaultPublication?.authors.join(", ")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue</Label>
          <Input id="venue" name="venue" required defaultValue={defaultPublication?.venue} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" name="year" type="number" required defaultValue={defaultPublication?.year} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue={defaultPublication?.type ?? "JOURNAL"}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="JOURNAL">{dict.publications.journal}</SelectItem>
            <SelectItem value="CONFERENCE">{dict.publications.conference}</SelectItem>
            <SelectItem value="PATENT">{dict.publications.patent}</SelectItem>
            <SelectItem value="BOOK_CHAPTER">{dict.publications.bookChapter}</SelectItem>
            <SelectItem value="OTHER">{dict.publications.other}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="doiOrLink">DOI / Link</Label>
        <Input id="doiOrLink" name="doiOrLink" type="url" defaultValue={defaultPublication?.doiOrLink ?? ""} />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
