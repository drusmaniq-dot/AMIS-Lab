import { prisma } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RejectDialog } from "./reject-dialog";
import { approveContent, type ContentKind } from "./actions";

export default async function AdminPendingContentPage() {
  const [people, projects, publications] = await Promise.all([
    prisma.person.findMany({ where: { state: "PENDING" }, include: { submittedBy: true } }),
    prisma.project.findMany({ where: { state: "PENDING" }, include: { submittedBy: true } }),
    prisma.publication.findMany({ where: { state: "PENDING" }, include: { submittedBy: true } }),
  ]);

  const rows = [
    ...people.map((p) => ({ kind: "person" as ContentKind, id: p.id, title: p.fullName, submitter: p.submittedBy?.email }))
      .map((r) => ({ ...r, type: "Person" })),
    ...projects.map((p) => ({ kind: "project" as ContentKind, id: p.id, title: p.title, submitter: p.submittedBy?.email }))
      .map((r) => ({ ...r, type: "Project" })),
    ...publications
      .map((p) => ({ kind: "publication" as ContentKind, id: p.id, title: p.title, submitter: p.submittedBy?.email }))
      .map((r) => ({ ...r, type: "Publication" })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Pending Content</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Member-submitted profiles, projects, and publications waiting for review.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing pending review.</p>
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Submitted by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.kind}-${row.id}`}>
                <TableCell>
                  <Badge variant="secondary">{row.type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-muted-foreground">{row.submitter ?? "—"}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <form action={approveContent.bind(null, row.kind, row.id)}>
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <RejectDialog kind={row.kind} id={row.id} title={row.title} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
