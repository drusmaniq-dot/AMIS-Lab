"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SimpleListEditor({
  fieldName,
  label,
  placeholder,
  defaultValues = [],
  dir,
}: {
  fieldName: string;
  label: string;
  placeholder?: string;
  defaultValues?: string[];
  dir?: "rtl";
}) {
  const [rows, setRows] = useState<string[]>(defaultValues.length > 0 ? defaultValues : [""]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {rows.map((value, i) => (
          <div key={i} className="flex gap-2">
            <Input
              name={fieldName}
              placeholder={placeholder}
              defaultValue={value}
              dir={dir}
              onChange={(e) => setRows((r) => r.map((v, idx) => (idx === i ? e.target.value : v)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              aria-label="Remove"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, ""])}>
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
}
