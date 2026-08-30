import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentStateBadge } from "@/components/status-badge";
import { DeleteButton } from "@/components/delete-button";
import { Plus, Pencil } from "lucide-react";
import { adminDeletePerson } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminPeoplePage() {
  const [people, { dict }] = await Promise.all([
    prisma.person.findMany({ orderBy: { createdAt: "desc" } }),
    getDictionary(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{dict.admin.people}</h1>
        <Button size="sm" render={<Link href="/admin/people/new" />}>
          <Plus className="size-4" />
          {dict.admin.newPerson}
        </Button>
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>{dict.common.name}</TableHead>
            <TableHead>{dict.common.role}</TableHead>
            <TableHead>{dict.common.status}</TableHead>
            <TableHead className="text-right">{dict.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {people.map((person) => (
            <TableRow key={person.id}>
              <TableCell className="font-medium">{person.fullName}</TableCell>
              <TableCell className="text-muted-foreground">{person.category}</TableCell>
              <TableCell>
                <ContentStateBadge state={person.state} />
              </TableCell>
              <TableCell className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" render={<Link href={`/admin/people/${person.id}/edit`} />}>
                  <Pencil className="size-4" />
                </Button>
                <DeleteButton action={adminDeletePerson.bind(null, person.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
