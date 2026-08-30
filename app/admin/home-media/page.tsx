import { prisma } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { AddHomeMediaForm } from "./add-home-media-form";
import { toggleHomeMedia, deleteHomeMedia } from "./actions";

export default async function AdminHomeMediaPage() {
  const media = await prisma.homeMedia.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Home Media</h1>
      <p className="mt-1 text-sm text-muted-foreground">Shown in the Media gallery on the Home page.</p>

      <div className="mt-6">
        <AddHomeMediaForm />
      </div>

      {media.length > 0 && (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {media.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="secondary">{item.type === "IMAGE" ? "Image" : "Video"}</Badge>
                </TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{item.url}</TableCell>
                <TableCell>
                  <form action={toggleHomeMedia.bind(null, item.id, !item.isActive)}>
                    <Button type="submit" size="sm" variant={item.isActive ? "secondary" : "outline"}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Button>
                  </form>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteButton action={deleteHomeMedia.bind(null, item.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
