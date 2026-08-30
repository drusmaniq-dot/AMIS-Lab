"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSocialLink, type SocialLinkFormState } from "./actions";

export function AddSocialLinkForm() {
  const [state, formAction, pending] = useActionState<SocialLinkFormState, FormData>(addSocialLink, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="platform">Platform</Label>
        <Input id="platform" name="platform" placeholder="LinkedIn" required className="w-40" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://..." required className="w-64" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="icon">Icon slug (optional)</Label>
        <Input id="icon" name="icon" placeholder="linkedin" className="w-40" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add link"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
