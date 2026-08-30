import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/delete-button";
import { markMessageRead, deleteContactMessage } from "./actions";

export default async function AdminContactMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary">Contact Messages</h1>

      {messages.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {messages.map((message) => (
            <Card key={message.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {!message.isRead && <Badge>New</Badge>}
                      <p className="font-medium">{message.name}</p>
                      <span className="text-sm text-muted-foreground">{message.email}</span>
                    </div>
                    {message.subject && <p className="mt-1 text-sm font-medium">{message.subject}</p>}
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{message.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {message.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <form action={markMessageRead.bind(null, message.id, !message.isRead)}>
                      <Button type="submit" size="sm" variant="outline">
                        {message.isRead ? "Mark unread" : "Mark read"}
                      </Button>
                    </form>
                    <DeleteButton action={deleteContactMessage.bind(null, message.id)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
