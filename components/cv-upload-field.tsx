import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function CvUploadField({ currentUrl }: { currentUrl?: string | null }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="cv">CV (PDF)</Label>
      {currentUrl && (
        <p className="text-sm">
          <Link href={currentUrl} target="_blank" rel="noreferrer noopener" className="text-accent underline">
            View current CV
          </Link>
        </p>
      )}
      <Input id="cv" name="cv" type="file" accept="application/pdf" />
      <p className="text-xs text-muted-foreground">
        Upload a real CV PDF to show it as-is. Leave empty and the CV link will show an auto-generated CV built from
        the fields below instead.
      </p>
    </div>
  );
}
