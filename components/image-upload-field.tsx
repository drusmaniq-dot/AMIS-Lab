import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ImageUploadField({
  name,
  label,
  currentUrl,
}: {
  name: string;
  label: string;
  currentUrl?: string | null;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {currentUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={currentUrl} alt="" className="h-20 w-20 rounded object-cover" />
      )}
      <Input id={name} name={name} type="file" accept="image/jpeg,image/png,image/webp" />
      <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP, up to 5MB. Leave empty to keep the current image.</p>
    </div>
  );
}
