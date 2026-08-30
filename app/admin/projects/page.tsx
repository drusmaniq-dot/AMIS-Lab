import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentStateBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { Plus, Pencil } from "lucide-react";
import { adminDeleteProject } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminProjectsPage() {
  const [projects, { dict }] = await Promise.all([
    prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{dict.admin.projects}</h1>
        <Button size="sm" render={<Link href="/admin/projects/new" />}>
          <Plus className="size-4" />
          {dict.admin.newProject}
        </Button>
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>{dict.common.title}</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>{dict.common.status}</TableHead>
            <TableHead className="text-right">{dict.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell className="text-muted-foreground">{project.phase}</TableCell>
              <TableCell>
                <ContentStateBadge state={project.state} />
              </TableCell>
              <TableCell className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" render={<Link href={`/admin/projects/${project.id}/edit`} />}>
                  <Pencil className="size-4" />
                </Button>
                <DeleteButton action={adminDeleteProject.bind(null, project.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
