import { ProjectForm } from "@/components/project-form";
import { ComingSoon } from "@/components/coming-soon";
import { requireAuth } from "@/lib/permissions";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN" && !MEMBER_CONTENT_SUBMISSIONS_ENABLED) {
    const { dict } = await getDictionary();
    return <ComingSoon section={dict.dashboard.myProjects} heading={dict.dashboard.comingSoon} body={dict.dashboard.comingSoonBody} />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">New Project</h1>
      <div className="mt-6">
        <ProjectForm action={createProject} />
      </div>
    </div>
  );
}
