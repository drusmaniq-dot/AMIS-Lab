import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentStateBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { Plus, Pencil } from "lucide-react";
import { adminDeletePublication } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminPublicationsPage() {
  const [publications, { dict }] = await Promise.all([
    prisma.publication.findMany({ orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{dict.admin.publications}</h1>
        <Button size="sm" render={<Link href="/admin/publications/new" />}>
          <Plus className="size-4" />
          {dict.admin.newPublication}
        </Button>
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>{dict.common.title}</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>{dict.common.status}</TableHead>
            <TableHead className="text-right">{dict.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {publications.map((pub) => (
            <TableRow key={pub.id}>
              <TableCell className="font-medium">{pub.title}</TableCell>
              <TableCell className="text-muted-foreground">{pub.year}</TableCell>
              <TableCell>
                <ContentStateBadge state={pub.state} />
              </TableCell>
              <TableCell className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" render={<Link href={`/admin/publications/${pub.id}/edit`} />}>
                  <Pencil className="size-4" />
                </Button>
                <DeleteButton action={adminDeletePublication.bind(null, pub.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
