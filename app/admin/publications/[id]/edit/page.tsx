import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicationForm } from "@/components/publication-form";
import { adminUpdatePublication } from "../../actions";

export default async function EditAdminPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const publication = await prisma.publication.findUnique({ where: { id } });
  if (!publication) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Publication</h1>
      <div className="mt-6">
        <PublicationForm action={adminUpdatePublication.bind(null, id)} defaultPublication={publication} />
      </div>
    </div>
  );
}
