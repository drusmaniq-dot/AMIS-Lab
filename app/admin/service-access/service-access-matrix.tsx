"use client";

import { useState, useTransition } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { setServiceAccess } from "./actions";

interface Member {
  id: string;
  name: string;
  email: string;
  status: string;
  allowedServiceIds: string[];
}

interface Service {
  id: string;
  title: string;
}

export function ServiceAccessMatrix({ members, services }: { members: Member[]; services: Service[] }) {
  const [grants, setGrants] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(members.map((m) => [m.id, new Set(m.allowedServiceIds)]))
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(userId: string, serviceId: string) {
    const key = `${userId}-${serviceId}`;
    const currentlyGranted = grants[userId]?.has(serviceId) ?? false;
    const nextGranted = !currentlyGranted;

    setGrants((prev) => {
      const next = new Set(prev[userId]);
      if (nextGranted) next.add(serviceId);
      else next.delete(serviceId);
      return { ...prev, [userId]: next };
    });
    setPendingKey(key);

    startTransition(async () => {
      try {
        await setServiceAccess(userId, serviceId, nextGranted);
      } catch {
        // Revert on failure
        setGrants((prev) => {
          const next = new Set(prev[userId]);
          if (currentlyGranted) next.add(serviceId);
          else next.delete(serviceId);
          return { ...prev, [userId]: next };
        });
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            {services.map((s) => (
              <TableHead key={s.id} className="text-center whitespace-nowrap">
                {s.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="font-medium">{member.name}</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {member.email}
                  {member.status !== "APPROVED" && (
                    <Badge variant="outline" className="text-[10px]">
                      {member.status}
                    </Badge>
                  )}
                </div>
              </TableCell>
              {services.map((service) => {
                const key = `${member.id}-${service.id}`;
                return (
                  <TableCell key={service.id} className="text-center">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={grants[member.id]?.has(service.id) ?? false}
                      disabled={pendingKey === key}
                      onChange={() => toggle(member.id, service.id)}
                      aria-label={`Grant ${member.name} access to ${service.title}`}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
