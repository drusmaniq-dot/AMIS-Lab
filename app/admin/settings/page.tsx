import { getSiteSettings } from "@/lib/data";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Home &amp; Director</h1>
      <div className="mt-6">
        <SettingsForm defaults={settings} />
      </div>
    </div>
  );
}
