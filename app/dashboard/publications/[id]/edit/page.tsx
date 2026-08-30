import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnerOrAdmin } from "@/lib/permissions";
import { PublicationForm } from "@/components/publication-form";
import { updatePublication } from "../../actions";

export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
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
