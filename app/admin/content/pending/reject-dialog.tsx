"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { rejectContent, type ContentKind } from "./actions";

export function RejectDialog({ kind, id, title }: { kind: ContentKind; id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleReject() {
    startTransition(async () => {
      try {
        await rejectContent(kind, id, reason);
        toast.success("Rejected.");
        setOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to reject.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpen(true)}>
        Reject
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject &ldquo;{title}&rdquo;?</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="Reason (shown to the submitter)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button variant="destructive" onClick={handleReject} disabled={pending}>
            {pending ? "Rejecting..." : "Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
