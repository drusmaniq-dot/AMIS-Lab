import { ProjectForm } from "@/components/project-form";
import { adminCreateProject } from "../actions";

export default function NewAdminProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Project</h1>
      <div className="mt-6">
        <ProjectForm action={adminCreateProject} />
      </div>
    </div>
  );
}
