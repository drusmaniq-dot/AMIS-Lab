"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/components/i18n-provider";
import { completeOnboarding } from "./actions";

export function OnboardingForm() {
  const { dict } = useI18n();
  const router = useRouter();
  const { update } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("password", password);

    const result = await completeOnboarding(undefined, formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    // Forces the jwt callback's trigger==="update" branch so the session
    // reflects profileComplete: true before we redirect — otherwise
    // proxy.ts would read the stale token and bounce back here.
    await update();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{dict.auth.onboardingEmailLabel}</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{dict.auth.onboardingPasswordLabel}</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{dict.auth.passwordHint}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? dict.common.submitting : dict.auth.onboardingSubmit}
      </Button>
    </form>
  );
}
