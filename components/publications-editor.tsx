"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PublicationValue {
  citation: string;
  url?: string;
}

export function PublicationsEditor({ defaultPublications = [] }: { defaultPublications?: PublicationValue[] }) {
  const [rows, setRows] = useState<PublicationValue[]>(
    defaultPublications.length > 0 ? defaultPublications : [{ citation: "", url: "" }]
  );

  return (
    <div className="space-y-2">
      <Label>Publications</Label>
      <p className="text-xs text-muted-foreground">Full citation text, plus an optional link (DOI, journal page, etc).</p>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input name="publicationCitation" placeholder="Full citation text" defaultValue={row.citation} />
              <Input name="publicationUrl" placeholder="https://doi.org/... (optional)" defaultValue={row.url} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              aria-label="Remove publication"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => setRows((r) => [...r, { citation: "", url: "" }])}>
        <Plus className="size-4" />
        Add publication
      </Button>
    </div>
  );
}
