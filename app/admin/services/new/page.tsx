import { ServiceForm } from "@/components/service-form";
import { adminCreateService } from "../actions";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Service</h1>
      <div className="mt-6">
        <ServiceForm action={adminCreateService} />
      </div>
    </div>
  );
}
