import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ServiceForm } from "@/components/service-form";
import { adminUpdateService } from "../../actions";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Service</h1>
      <div className="mt-6">
        <ServiceForm action={adminUpdateService.bind(null, id)} defaultService={service} />
      </div>
    </div>
  );
}
