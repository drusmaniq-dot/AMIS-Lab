import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentStateBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { ComingSoon } from "@/components/coming-soon";
import { MEMBER_CONTENT_SUBMISSIONS_ENABLED } from "@/lib/feature-flags";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { Plus, Pencil } from "lucide-react";
import { deleteOwnProject } from "./actions";

export default async function DashboardProjectsPage() {
  const session = await requireAuth();

  if (session.user.role !== "ADMIN" && session.user.role !== "TEAM" && !MEMBER_CONTENT_SUBMISSIONS_ENABLED) {
    const { dict } = await getDictionary();
    return <ComingSoon section={dict.dashboard.myProjects} heading={dict.dashboard.comingSoon} body={dict.dashboard.comingSoonBody} />;
  }

  const projects = await prisma.project.findMany({
    where: { owners: { some: { id: session.user.id } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">My Projects</h1>
        <Button size="sm" render={<Link href="/dashboard/projects/new" />}>
          <Plus className="size-4" />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">You haven&apos;t submitted any projects yet.</p>
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.title}</TableCell>
                <TableCell>
                  <ContentStateBadge state={project.state} />
                  {project.state === "REJECTED" && project.rejectionReason && (
                    <p className="mt-1 text-xs text-destructive">{project.rejectionReason}</p>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" render={<Link href={`/dashboard/projects/${project.id}/edit`} />}>
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteButton action={deleteOwnProject.bind(null, project.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
