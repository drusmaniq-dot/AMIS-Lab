import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOwnerOrAdmin } from "@/lib/permissions";
import { ProjectForm } from "@/components/project-form";
import { updateProject } from "../../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();
  await requireOwnerOrAdmin(project.submittedById);

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Edit Project</h1>
      <div className="mt-6">
        <ProjectForm action={updateProject.bind(null, id)} defaultProject={project} />
      </div>
    </div>
  );
}
