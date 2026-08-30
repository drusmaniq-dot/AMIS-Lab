"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const COLLAPSED_LENGTH = 160;

export function CollapsibleBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > COLLAPSED_LENGTH;
  const text = expanded || !isLong ? bio : `${bio.slice(0, COLLAPSED_LENGTH).trimEnd()}…`;

  return (
    <div>
      <p className="whitespace-pre-line text-sm text-muted-foreground">{text}</p>
      {isLong && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-sm"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read more"}
        </Button>
      )}
    </div>
  );
}
