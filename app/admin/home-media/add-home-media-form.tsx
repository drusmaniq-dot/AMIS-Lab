"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addHomeMedia, type HomeMediaFormState } from "./actions";

export function AddHomeMediaForm() {
  const [state, formAction, pending] = useActionState<HomeMediaFormState, FormData>(addHomeMedia, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="type">Type</Label>
        <Select name="type" defaultValue="IMAGE">
          <SelectTrigger id="type" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IMAGE">Image</SelectItem>
            <SelectItem value="VIDEO_EMBED">Video embed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://..." required className="w-72" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="caption">Caption (English, optional)</Label>
        <Input id="caption" name="caption" className="w-56" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="captionAr">التعليق (بالعربية، اختياري)</Label>
        <Input id="captionAr" name="captionAr" dir="rtl" className="w-56" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add media"}
      </Button>
      {state?.error && <p className="w-full text-sm text-destructive">{state.error}</p>}
      <p className="w-full text-xs text-muted-foreground">
        Images: any hosted image URL. Video: an embeddable URL (e.g. https://www.youtube.com/embed/VIDEO_ID).
      </p>
    </form>
  );
}
