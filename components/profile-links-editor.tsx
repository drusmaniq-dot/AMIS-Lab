"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProfileLinkValue {
  label: string;
  url: string;
}

export function ProfileLinksEditor({ defaultLinks = [] }: { defaultLinks?: ProfileLinkValue[] }) {
  const [rows, setRows] = useState<ProfileLinkValue[]>(
    defaultLinks.length > 0 ? defaultLinks : [{ label: "", url: "" }]
  );

  return (
    <div className="space-y-2">
      <Label>Profile links</Label>
      <p className="text-xs text-muted-foreground">
        E.g. LinkedIn, Google Scholar, ORCID, IEEE Xplore — any label works.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <Input
              name="profileLinkLabel"
              placeholder="Label (e.g. LinkedIn)"
              defaultValue={row.label}
              className="w-40 shrink-0"
            />
            <Input name="profileLinkUrl" placeholder="https://..." defaultValue={row.url} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              aria-label="Remove link"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((r) => [...r, { label: "", url: "" }])}
      >
        <Plus className="size-4" />
        Add link
      </Button>
    </div>
  );
}
