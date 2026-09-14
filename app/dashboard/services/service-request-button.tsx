"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestServiceAccess } from "./actions";

export function ServiceRequestButton({
  serviceId,
  label,
}: {
  serviceId: string;
  label: string;
}) {
  const [requested, setRequested] = useState(false);
  const [pending, startTransition] = useTransition();

  if (requested) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        setRequested(true);
        startTransition(() => requestServiceAccess(serviceId));
      }}
    >
      {label}
    </Button>
  );
}
