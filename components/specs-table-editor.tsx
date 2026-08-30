"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SpecRow {
  label: string;
  value: string;
}

export function SpecsTableEditor({
  fieldPrefix,
  title,
  defaultRows = [],
  dir,
}: {
  fieldPrefix: string;
  title: string;
  defaultRows?: SpecRow[];
  dir?: "rtl" | "ltr";
}) {
  const [rows, setRows] = useState<SpecRow[]>(defaultRows.length > 0 ? defaultRows : [{ label: "", value: "" }]);

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2" dir={dir}>
            <Input
              name={`${fieldPrefix}Label`}
              placeholder="Parameter (e.g. Mass range)"
              defaultValue={row.label}
              dir={dir}
              className="w-48 shrink-0"
            />
            <Input
              name={`${fieldPrefix}Value`}
              placeholder="Value (e.g. m/z 2-260)"
              defaultValue={row.value}
              dir={dir}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              aria-label="Remove row"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { label: "", value: "" }])}>
        <Plus className="size-4" />
        Add row
      </Button>
    </div>
  );
}
