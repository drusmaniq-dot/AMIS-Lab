import { EquipmentForm } from "@/components/equipment-form";
import { adminCreateEquipment } from "../actions";

export default function NewEquipmentPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Equipment</h1>
      <div className="mt-6">
        <EquipmentForm action={adminCreateEquipment} />
      </div>
    </div>
  );
}
