import { getSiteSettings } from "@/lib/data";
import { ContactForm } from "./contact-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { pickLocalized } from "@/lib/i18n/config";

export default async function ContactPage() {
  const [settings, { locale, dict }] = await Promise.all([getSiteSettings(), getDictionary()]);
  const address = pickLocalized(locale, settings.contactAddress, settings.contactAddressAr);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-primary">{dict.contact.heading}</h1>
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-1 text-sm text-muted-foreground">
            {settings.directorName && <p className="font-semibold text-primary">{settings.directorName}</p>}
            {address && <p>{address}</p>}
            {settings.contactPhone && <p>Mobile: {settings.contactPhone}</p>}
            {settings.contactEmail && (
              <p>
                <a href={`mailto:${settings.contactEmail}`} className="text-accent hover:underline">
                  {settings.contactEmail}
                </a>
              </p>
            )}
          </div>
          {settings.mapEmbedUrl && (
            <iframe
              src={settings.mapEmbedUrl}
              title="Map"
              className="aspect-video w-full rounded-lg border"
              loading="lazy"
            />
          )}
        </div>
        <ContactForm />
      </div>
    </div>
  );
}
