"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploadField } from "@/components/image-upload-field";
import { CvUploadField } from "@/components/cv-upload-field";
import { ProfileLinksEditor, type ProfileLinkValue } from "@/components/profile-links-editor";
import { SimpleListEditor } from "@/components/simple-list-editor";
import { PublicationsEditor, type PublicationValue } from "@/components/publications-editor";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultPerson {
  fullName: string;
  titleOrRole: string;
  titleOrRoleAr?: string | null;
  bio: string;
  bioAr?: string | null;
  category: string;
  photoUrl: string | null;
  profileLinks: ProfileLinkValue[];
  cvUrl?: string | null;
  academicDegree?: string | null;
  academicDegreeAr?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  addressAr?: string | null;
  discipline?: string | null;
  disciplineAr?: string | null;
  subdiscipline?: string | null;
  subdisciplineAr?: string | null;
  researchInterests?: string[] | null;
  researchInterestsAr?: string[] | null;
  researchProjects?: string[] | null;
  researchProjectsAr?: string[] | null;
  publications?: PublicationValue[] | null;
  citationCount?: number | null;
  hIndex?: number | null;
}

export type PersonFormState = { error?: string; success?: boolean } | undefined;

export function PersonForm({
  action,
  defaultPerson,
  successMessage,
}: {
  action: (state: PersonFormState, formData: FormData) => Promise<PersonFormState>;
  defaultPerson?: DefaultPerson | null;
  successMessage?: string;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<PersonFormState, FormData>(action, undefined);
  const [tab, setTab] = useState<FormLocale>("en");

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">{dict.auth.fullName}</Label>
        <Input id="fullName" name="fullName" required defaultValue={defaultPerson?.fullName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">{dict.common.role}</Label>
        <Select name="category" defaultValue={defaultPerson?.category ?? "STUDENT"}>
          <SelectTrigger id="category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DIRECTOR">{dict.people.director}</SelectItem>
            <SelectItem value="FACULTY">{dict.people.faculty}</SelectItem>
            <SelectItem value="STUDENT">{dict.people.students}</SelectItem>
            <SelectItem value="ALUMNI">{dict.people.alumni}</SelectItem>
            <SelectItem value="STAFF">{dict.people.staff}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{dict.common.editingLanguage}</Label>
          <LanguageTabToggle value={tab} onChange={setTab} />
        </div>

        <div className={tab === "en" ? "space-y-4" : "hidden space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="titleOrRole">Role / title (English)</Label>
            <Input id="titleOrRole" name="titleOrRole" placeholder="e.g. PhD Student" defaultValue={defaultPerson?.titleOrRole} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (English)</Label>
            <Textarea id="bio" name="bio" rows={5} defaultValue={defaultPerson?.bio} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicDegree">Academic degree (English)</Label>
            <Input id="academicDegree" name="academicDegree" placeholder="e.g. Professor" defaultValue={defaultPerson?.academicDegree ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address (English)</Label>
            <Textarea id="address" name="address" rows={3} defaultValue={defaultPerson?.address ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discipline">Discipline (English)</Label>
            <Input id="discipline" name="discipline" defaultValue={defaultPerson?.discipline ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdiscipline">Subdiscipline (English)</Label>
            <Textarea id="subdiscipline" name="subdiscipline" rows={2} defaultValue={defaultPerson?.subdiscipline ?? ""} />
          </div>
          <SimpleListEditor
            fieldName="researchInterests"
            label="Research interests (English)"
            placeholder="e.g. Terahertz spectroscopy"
            defaultValues={defaultPerson?.researchInterests ?? []}
          />
          <SimpleListEditor
            fieldName="researchProjects"
            label="Research projects (English)"
            placeholder="e.g. Project name and short description"
            defaultValues={defaultPerson?.researchProjects ?? []}
          />
        </div>

        <div className={tab === "ar" ? "space-y-4" : "hidden space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="titleOrRoleAr">الدور / اللقب (بالعربية)</Label>
            <Input
              id="titleOrRoleAr"
              name="titleOrRoleAr"
              dir="rtl"
              placeholder="مثال: طالب دكتوراه"
              defaultValue={defaultPerson?.titleOrRoleAr ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bioAr">نبذة (بالعربية)</Label>
            <Textarea id="bioAr" name="bioAr" dir="rtl" rows={5} defaultValue={defaultPerson?.bioAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicDegreeAr">الدرجة العلمية (بالعربية)</Label>
            <Input id="academicDegreeAr" name="academicDegreeAr" dir="rtl" defaultValue={defaultPerson?.academicDegreeAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressAr">العنوان (بالعربية)</Label>
            <Textarea id="addressAr" name="addressAr" dir="rtl" rows={3} defaultValue={defaultPerson?.addressAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disciplineAr">التخصص (بالعربية)</Label>
            <Input id="disciplineAr" name="disciplineAr" dir="rtl" defaultValue={defaultPerson?.disciplineAr ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdisciplineAr">التخصص الدقيق (بالعربية)</Label>
            <Textarea id="subdisciplineAr" name="subdisciplineAr" dir="rtl" rows={2} defaultValue={defaultPerson?.subdisciplineAr ?? ""} />
          </div>
          <SimpleListEditor
            fieldName="researchInterestsAr"
            label="اهتمامات البحث (بالعربية)"
            dir="rtl"
            defaultValues={defaultPerson?.researchInterestsAr ?? []}
          />
          <SimpleListEditor
            fieldName="researchProjectsAr"
            label="المشاريع البحثية (بالعربية)"
            dir="rtl"
            defaultValues={defaultPerson?.researchProjectsAr ?? []}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={defaultPerson?.email ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={defaultPerson?.phone ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="citationCount">Citations (Google Scholar)</Label>
          <Input
            id="citationCount"
            name="citationCount"
            type="number"
            min={0}
            defaultValue={defaultPerson?.citationCount ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hIndex">h-index (Google Scholar)</Label>
          <Input id="hIndex" name="hIndex" type="number" min={0} defaultValue={defaultPerson?.hIndex ?? ""} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        These are manually-updated snapshots, not live-synced with Google Scholar. Leave blank if unknown.
      </p>

      <ImageUploadField name="photo" label="Photo" currentUrl={defaultPerson?.photoUrl} />
      <CvUploadField currentUrl={defaultPerson?.cvUrl} />
      <ProfileLinksEditor defaultLinks={defaultPerson?.profileLinks} />
      <PublicationsEditor defaultPublications={defaultPerson?.publications ?? []} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-success">{successMessage ?? dict.common.save}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
