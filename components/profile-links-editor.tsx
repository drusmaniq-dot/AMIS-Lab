"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProfileLinkValue {
  label: string;
  url: string;
  visible?: boolean;
}

export function ProfileLinksEditor({ defaultLinks = [] }: { defaultLinks?: ProfileLinkValue[] }) {
  const [rows, setRows] = useState<ProfileLinkValue[]>(
    defaultLinks.length > 0 ? defaultLinks : [{ label: "", url: "", visible: true }]
  );

  return (
    <div className="space-y-2">
      <Label>Profile links</Label>
      <p className="text-xs text-muted-foreground">
        E.g. LinkedIn, Google Scholar, ORCID, Scopus, IEEE Xplore — any label works. Uncheck &ldquo;Show
        publicly&rdquo; to keep a link saved here without displaying it on the site.
      </p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input
              name="profileLinkLabel"
              placeholder="Label (e.g. LinkedIn)"
              defaultValue={row.label}
              className="w-40 shrink-0"
            />
            <Input name="profileLinkUrl" placeholder="https://..." defaultValue={row.url} className="min-w-48 flex-1" />
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <input
                type="checkbox"
                name={`profileLinkVisible-${i}`}
                defaultChecked={row.visible !== false}
                className="size-4 accent-primary"
              />
              Show publicly
            </label>
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
        onClick={() => setRows((r) => [...r, { label: "", url: "", visible: true }])}
      >
        <Plus className="size-4" />
        Add link
      </Button>
    </div>
  );
}
