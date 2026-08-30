import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DigitalToolForm } from "@/components/digital-tool-form";
import { adminUpdateDigitalTool } from "../../actions";

export default async function EditDigitalToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = await prisma.digitalTool.findUnique({ where: { id } });
  if (!tool) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Digital Tool</h1>
      <div className="mt-6">
        <DigitalToolForm action={adminUpdateDigitalTool.bind(null, id)} defaultTool={tool} />
      </div>
    </div>
  );
}
