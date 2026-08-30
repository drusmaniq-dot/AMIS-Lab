import { prisma } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { AddSocialLinkForm } from "./add-social-link-form";
import { toggleSocialLink, deleteSocialLink } from "./actions";

export default async function AdminSocialLinksPage() {
  const links = await prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Social Links</h1>
      <p className="mt-1 text-sm text-muted-foreground">Shown in the footer on every page.</p>

      <div className="mt-6">
        <AddSocialLinkForm />
      </div>

      {links.length > 0 && (
        <Table className="mt-6">
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.map((link) => (
              <TableRow key={link.id}>
                <TableCell className="font-medium">{link.platform}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">{link.url}</TableCell>
                <TableCell>
                  <form action={toggleSocialLink.bind(null, link.id, !link.isActive)}>
                    <Button type="submit" size="sm" variant={link.isActive ? "secondary" : "outline"}>
                      {link.isActive ? "Active" : "Inactive"}
                    </Button>
                  </form>
                </TableCell>
                <TableCell className="text-right">
                  <DeleteButton action={deleteSocialLink.bind(null, link.id)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
