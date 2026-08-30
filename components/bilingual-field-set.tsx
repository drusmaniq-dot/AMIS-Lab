"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormLocale } from "@/components/language-tab-toggle";

export interface BilingualField {
  name: string;
  labelEn: string;
  labelAr: string;
  defaultEn?: string | null;
  defaultAr?: string | null;
  multiline?: boolean;
  placeholderEn?: string;
  placeholderAr?: string;
}

/** Renders the same set of fields twice — once per language — and shows only
 * the active tab. Both stay mounted so nothing is lost switching back and forth,
 * and both submit with the form regardless of which is currently visible. */
export function BilingualFieldSet({ tab, fields }: { tab: FormLocale; fields: BilingualField[] }) {
  return (
    <>
      <div className={tab === "en" ? "space-y-4" : "hidden space-y-4"}>
        {fields.map((f) => (
          <div key={f.name} className="space-y-2">
            <Label htmlFor={f.name}>{f.labelEn}</Label>
            {f.multiline ? (
              <Textarea id={f.name} name={f.name} rows={4} defaultValue={f.defaultEn ?? ""} placeholder={f.placeholderEn} />
            ) : (
              <Input id={f.name} name={f.name} defaultValue={f.defaultEn ?? ""} placeholder={f.placeholderEn} />
            )}
          </div>
        ))}
      </div>
      <div className={tab === "ar" ? "space-y-4" : "hidden space-y-4"}>
        {fields.map((f) => (
          <div key={`${f.name}Ar`} className="space-y-2">
            <Label htmlFor={`${f.name}Ar`}>{f.labelAr}</Label>
            {f.multiline ? (
              <Textarea
                id={`${f.name}Ar`}
                name={`${f.name}Ar`}
                dir="rtl"
                rows={4}
                defaultValue={f.defaultAr ?? ""}
                placeholder={f.placeholderAr}
              />
            ) : (
              <Input
                id={`${f.name}Ar`}
                name={`${f.name}Ar`}
                dir="rtl"
                defaultValue={f.defaultAr ?? ""}
                placeholder={f.placeholderAr}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
