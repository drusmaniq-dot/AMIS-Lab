import { DigitalToolForm } from "@/components/digital-tool-form";
import { adminCreateDigitalTool } from "../actions";

export default function NewDigitalToolPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Digital Tool</h1>
      <div className="mt-6">
        <DigitalToolForm action={adminCreateDigitalTool} />
      </div>
    </div>
  );
}
