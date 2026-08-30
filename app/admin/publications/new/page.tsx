import { PublicationForm } from "@/components/publication-form";
import { adminCreatePublication } from "../actions";

export default function NewAdminPublicationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Publication</h1>
      <div className="mt-6">
        <PublicationForm action={adminCreatePublication} />
      </div>
    </div>
  );
}
