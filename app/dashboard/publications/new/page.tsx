import { PublicationForm } from "@/components/publication-form";
import { ComingSoon } from "@/components/coming-soon";
import { requireAuth } from "@/lib/permissions";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createPublication } from "../actions";

export default async function NewPublicationPage() {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN" && session.user.role !== "TEAM" && !MEMBER_CONTENT_SUBMISSIONS_ENABLED) {
    const { dict } = await getDictionary();
    return <ComingSoon section={dict.dashboard.myPublications} heading={dict.dashboard.comingSoon} body={dict.dashboard.comingSoonBody} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Publication</h1>
      <div className="mt-6">
        <PublicationForm action={createPublication} />
      </div>
    </div>
  );
}
