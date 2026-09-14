"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createTeamAccount, type CreateTeamAccountState } from "./actions";

export function TeamAccountForm({
  people,
}: {
  people: { id: string; fullName: string; category: string }[];
}) {
  const [state, formAction, pending] = useActionState<CreateTeamAccountState, FormData>(
    createTeamAccount,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="personId">Person</Label>
        <Select name="personId" required>
          <SelectTrigger id="personId" className="w-full">
            <SelectValue placeholder="Select a person" />
          </SelectTrigger>
          <SelectContent>
            {people.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" required minLength={3} placeholder="e.g. eyousef" />
        <p className="text-xs text-muted-foreground">
          They&rsquo;ll sign in with this until they set a real email. No spaces or @ symbols.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="temporaryPassword">Temporary password</Label>
        <Input id="temporaryPassword" name="temporaryPassword" required minLength={8} />
        <p className="text-xs text-muted-foreground">
          Relay this and the username to them directly — it&rsquo;s not emailed automatically.
        </p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </Button>
    </form>
  );
}
