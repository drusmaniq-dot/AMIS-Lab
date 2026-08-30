import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentStateBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { Plus, Pencil } from "lucide-react";
import { deleteOwnPublication } from "./actions";

export default async function DashboardPublicationsPage() {
  const session = await requireAuth();
  const publications = await prisma.publication.findMany({
    where: { submittedById: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">My Publications</h1>
        <Button size="sm" render={<Link href="/dashboard/publications/new" />}>
          <Plus className="size-4" />
          New publication
        </Button>
      </div>

      {publications.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">You haven&apos;t submitted any publications yet.</p>
      ) : (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publications.map((pub) => (
              <TableRow key={pub.id}>
                <TableCell className="font-medium">{pub.title}</TableCell>
                <TableCell>{pub.year}</TableCell>
                <TableCell>
                  <ContentStateBadge state={pub.state} />
                  {pub.state === "REJECTED" && pub.rejectionReason && (
                    <p className="mt-1 text-xs text-destructive">{pub.rejectionReason}</p>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" render={<Link href={`/dashboard/publications/${pub.id}/edit`} />}>
                    <Pencil className="size-4" />
                  </Button>
                  <DeleteButton action={deleteOwnPublication.bind(null, pub.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
