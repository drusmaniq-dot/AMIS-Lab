import { ProjectForm } from "@/components/project-form";
import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Project</h1>
      <div className="mt-6">
        <ProjectForm action={createProject} />
      </div>
    </div>
  );
}
