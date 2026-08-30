import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteButton } from "@/components/delete-button";
import { Plus, Pencil } from "lucide-react";
import { adminDeleteDigitalTool } from "./actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AdminDigitalToolsPage() {
  const [tools, { dict }] = await Promise.all([
    prisma.digitalTool.findMany({ orderBy: { sortOrder: "asc" } }),
    getDictionary(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{dict.admin.digitalTools}</h1>
        <Button size="sm" render={<Link href="/admin/digital-tools/new" />}>
          <Plus className="size-4" />
          {dict.admin.newTool}
        </Button>
      </div>

      <Table className="mt-6">
        <TableHeader>
          <TableRow>
            <TableHead>{dict.common.title}</TableHead>
            <TableHead className="text-right">{dict.common.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <TableRow key={tool.id}>
              <TableCell className="font-medium">{tool.title}</TableCell>
              <TableCell className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" render={<Link href={`/admin/digital-tools/${tool.id}/edit`} />}>
                  <Pencil className="size-4" />
                </Button>
                <DeleteButton action={adminDeleteDigitalTool.bind(null, tool.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
