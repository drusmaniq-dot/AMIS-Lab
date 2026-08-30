import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/project-form";
import { adminUpdateProject } from "../../actions";

export default async function EditAdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Project</h1>
      <div className="mt-6">
        <ProjectForm action={adminUpdateProject.bind(null, id)} defaultProject={project} />
      </div>
    </div>
  );
}
