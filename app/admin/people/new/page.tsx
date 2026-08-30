import { PersonForm } from "@/components/person-form";
import { adminCreatePerson } from "../actions";

export default function NewPersonPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Person</h1>
      <div className="mt-6">
        <PersonForm action={adminCreatePerson} successMessage="Created and published." />
      </div>
    </div>
  );
}
