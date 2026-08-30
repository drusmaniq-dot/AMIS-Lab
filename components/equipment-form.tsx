"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/image-upload-field";
import { BilingualFieldSet } from "@/components/bilingual-field-set";
import { SpecsTableEditor, type SpecRow } from "@/components/specs-table-editor";
import { LanguageTabToggle, type FormLocale } from "@/components/language-tab-toggle";
import { useI18n } from "@/components/i18n-provider";

export interface DefaultEquipment {
  name: string;
  nameAr?: string | null;
  unit?: string | null;
  unitAr?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  description: string;
  descriptionAr?: string | null;
  specsTable?: SpecRow[] | null;
  specsTableAr?: SpecRow[] | null;
  location: string | null;
  locationAr?: string | null;
  imageUrl: string | null;
}

export type EquipmentFormState = { error?: string } | undefined;

export function EquipmentForm({
  action,
  defaultEquipment,
}: {
  action: (state: EquipmentFormState, formData: FormData) => Promise<EquipmentFormState>;
  defaultEquipment?: DefaultEquipment;
}) {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<EquipmentFormState, FormData>(action, undefined);
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
            { name: "name", labelEn: "Name (English)", labelAr: "الاسم (بالعربية)", defaultEn: defaultEquipment?.name, defaultAr: defaultEquipment?.nameAr },
            { name: "unit", labelEn: "Unit / group (English)", labelAr: "الوحدة (بالعربية)", defaultEn: defaultEquipment?.unit, defaultAr: defaultEquipment?.unitAr, placeholderEn: "e.g. Core Equipment Unit" },
            { name: "description", labelEn: "Description (English)", labelAr: "الوصف (بالعربية)", defaultEn: defaultEquipment?.description, defaultAr: defaultEquipment?.descriptionAr, multiline: true },
            { name: "location", labelEn: "Location (English)", labelAr: "الموقع (بالعربية)", defaultEn: defaultEquipment?.location, defaultAr: defaultEquipment?.locationAr, placeholderEn: "e.g. Room 204" },
          ]}
        />

        <div className={tab === "en" ? "" : "hidden"}>
          <SpecsTableEditor
            fieldPrefix="specsTable"
            title="Manufacturer technical specifications (English)"
            defaultRows={defaultEquipment?.specsTable ?? []}
          />
        </div>
        <div className={tab === "ar" ? "" : "hidden"}>
          <SpecsTableEditor
            fieldPrefix="specsTableAr"
            title="المواصفات الفنية للشركة المصنعة (بالعربية)"
            defaultRows={defaultEquipment?.specsTableAr ?? []}
            dir="rtl"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Leave one language blank and it will be auto-translated from the other on save. The unit/group field powers the tabs on the public Equipment page.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={defaultEquipment?.model ?? ""} placeholder="e.g. 7850 ICP-MS" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input id="manufacturer" name="manufacturer" defaultValue={defaultEquipment?.manufacturer ?? ""} placeholder="e.g. Agilent Technologies" />
        </div>
      </div>

      <ImageUploadField name="image" label="Photo" currentUrl={defaultEquipment?.imageUrl} />

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.common.save}
      </Button>
    </form>
  );
}
