"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  action,
  confirmMessage = "Are you sure? This can't be undone.",
  label,
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmMessage?: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant="ghost" size={label ? "sm" : "icon"} className="text-destructive">
        <Trash2 className="size-4" />
        {label}
      </Button>
    </form>
  );
}
