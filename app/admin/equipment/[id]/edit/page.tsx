import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { EquipmentForm } from "@/components/equipment-form";
import type { SpecRow } from "@/components/specs-table-editor";
import { adminUpdateEquipment } from "../../actions";

export default async function EditEquipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const equipment = await prisma.equipment.findUnique({ where: { id } });
  if (!equipment) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Equipment</h1>
      <div className="mt-6">
        <EquipmentForm
          action={adminUpdateEquipment.bind(null, id)}
          defaultEquipment={{
            ...equipment,
            specsTable: (equipment.specsTable as unknown as SpecRow[] | null) ?? [],
            specsTableAr: (equipment.specsTableAr as unknown as SpecRow[] | null) ?? [],
          }}
        />
      </div>
    </div>
  );
}
