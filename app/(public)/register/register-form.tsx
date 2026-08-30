"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { registerAction, type RegisterState } from "./actions";

export function RegisterForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerAction,
    undefined
  );

  if (state?.success) {
    return (
      <div className="space-y-3 text-center">
        <p className="font-medium text-primary">{dict.auth.submitted}</p>
        <p className="text-sm text-muted-foreground">{dict.auth.submittedBody}</p>
        <Button className="mt-2" render={<Link href="/login" />}>
          {dict.auth.backToLogin}
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{dict.auth.fullName}</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{dict.common.email}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{dict.auth.password}</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
        <p className="text-xs text-muted-foreground">{dict.auth.passwordHint}</p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.common.submitting : dict.auth.registerButton}
      </Button>
    </form>
  );
}
