"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploadField } from "@/components/image-upload-field";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultProject {
  title: string;
  titleAr?: string | null;
  summary: string;
  summaryAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  phase: string;
  projectNumber?: string | null;
  investigator?: string | null;
  externalUrl: string | null;
  tags: string[];
  coverImageUrl: string | null;
}

export type ProjectFormState = { error?: string } | undefined;

export function ProjectForm({
  action,
  defaultProject,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  defaultProject?: DefaultProject;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(action, undefined);
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
            <Input id="title" name="title" defaultValue={defaultProject?.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary (English)</Label>
            <Input id="summary" name="summary" defaultValue={defaultProject?.summary} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (English)</Label>
            <Textarea id="description" name="description" rows={6} defaultValue={defaultProject?.description} />
          </div>
        </div>

        <div className={tab === "ar" ? "space-y-4" : "hidden space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="titleAr">العنوان (بالعربية)</Label>
            <Input id="titleAr" name="titleAr" dir="rtl" defaultValue={defaultProject?.titleAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summaryAr">الملخص (بالعربية)</Label>
            <Input id="summaryAr" name="summaryAr" dir="rtl" defaultValue={defaultProject?.summaryAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descriptionAr">الوصف (بالعربية)</Label>
            <Textarea id="descriptionAr" name="descriptionAr" dir="rtl" rows={6} defaultValue={defaultProject?.descriptionAr ?? ""} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phase">Phase</Label>
        <Select name="phase" defaultValue={defaultProject?.phase ?? "PLANNED"}>
          <SelectTrigger id="phase" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANNED">{dict.projects.planned}</SelectItem>
            <SelectItem value="ONGOING">{dict.projects.ongoing}</SelectItem>
            <SelectItem value="COMPLETED">{dict.projects.completed}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectNumber">{dict.projects.projectNumber}</Label>
        <Input
          id="projectNumber"
          name="projectNumber"
          placeholder="e.g. RGP.2/586/44"
          defaultValue={defaultProject?.projectNumber ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="investigator">{dict.projects.investigator}</Label>
        <Input
          id="investigator"
          name="investigator"
          placeholder="e.g. Principal Investigator: Prof. Dr. El Sayed Yousef"
          defaultValue={defaultProject?.investigator ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="e.g. optic-glasses, nanomaterials"
          defaultValue={defaultProject?.tags.join(", ")}
        />
        <p className="text-xs text-muted-foreground">Comma-separated. Use optic-glasses / shielding-glasses / bioglasses to tag a sub-brand.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="externalUrl">External link</Label>
        <Input id="externalUrl" name="externalUrl" type="url" defaultValue={defaultProject?.externalUrl ?? ""} />
      </div>
      <ImageUploadField name="coverImage" label="Cover image" currentUrl={defaultProject?.coverImageUrl} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
