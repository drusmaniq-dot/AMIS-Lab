"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setUserRole, setUserStatus } from "./actions";
import type { Role, UserStatus } from "@/lib/generated/prisma/client";

export function UserRowActions({
  userId,
  role,
  status,
  isSelf,
}: {
  userId: string;
  role: Role;
  status: UserStatus;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function handleRoleChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      try {
        await setUserRole(userId, value as Role);
        toast.success("Role updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update role.");
      }
    });
  }

  function handleStatusChange(value: string | null) {
    if (!value) return;
    startTransition(async () => {
      try {
        await setUserStatus(userId, value as UserStatus);
        toast.success("Status updated.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status.");
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Select value={role} onValueChange={handleRoleChange} disabled={pending || isSelf}>
        <SelectTrigger size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MEMBER">Member</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={handleStatusChange} disabled={pending || isSelf}>
        <SelectTrigger size="sm" className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="APPROVED">Approved</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
