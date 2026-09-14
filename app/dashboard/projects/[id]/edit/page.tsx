import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth, requireOwnerOrAdmin } from "@/lib/permissions";
import { ProjectForm } from "@/components/project-form";
import { ComingSoon } from "@/components/coming-soon";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { updateProject } from "../../actions";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN" && !MEMBER_CONTENT_SUBMISSIONS_ENABLED) {
    const { dict } = await getDictionary();
    return <ComingSoon section={dict.dashboard.myProjects} heading={dict.dashboard.comingSoon} body={dict.dashboard.comingSoonBody} />;
  }

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
