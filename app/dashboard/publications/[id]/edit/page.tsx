import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/permissions";
import { PublicationForm } from "@/components/publication-form";
import { ComingSoon } from "@/components/coming-soon";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { updatePublication } from "../../actions";

export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN" && session.user.role !== "TEAM" && !MEMBER_CONTENT_SUBMISSIONS_ENABLED) {
    const { dict } = await getDictionary();
    return <ComingSoon section={dict.dashboard.myPublications} heading={dict.dashboard.comingSoon} body={dict.dashboard.comingSoonBody} />;
  }

  const { id } = await params;
  const publication = await prisma.publication.findUnique({ where: { id } });
  if (!publication) notFound();
  await requireOwnerOrAdmin(publication.submittedById);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Publication</h1>
      <div className="mt-6">
        <PublicationForm action={updatePublication.bind(null, id)} defaultPublication={publication} />
      </div>
    </div>
  );
}
