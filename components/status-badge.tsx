import { Badge } from "@/components/ui/badge";
import type { ContentState, UserStatus } from "@/lib/generated/prisma/client";

const CONTENT_STYLES: Record<ContentState, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  PUBLISHED: "bg-success/15 text-success dark:text-success",
  REJECTED: "bg-destructive/15 text-destructive",
};

const USER_STATUS_STYLES: Record<UserStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  APPROVED: "bg-success/15 text-success dark:text-success",
  REJECTED: "bg-destructive/15 text-destructive",
  SUSPENDED: "bg-muted text-muted-foreground",
};

export function ContentStateBadge({ state }: { state: ContentState }) {
  return (
    <Badge variant="outline" className={CONTENT_STYLES[state]}>
      {state.charAt(0) + state.slice(1).toLowerCase()}
    </Badge>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="outline" className={USER_STATUS_STYLES[status]}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
