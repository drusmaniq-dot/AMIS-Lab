"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n-provider";
import { sendContactMessage, type ContactState } from "./actions";

export function ContactForm() {
  const { dict } = useI18n();
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    undefined
  );

  if (state?.success) {
    return <p className="font-medium text-primary">{dict.contact.sent}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{dict.contact.name}</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{dict.contact.email}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">{dict.contact.subject}</Label>
        <Input id="subject" name="subject" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">{dict.contact.message}</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? dict.contact.sending : dict.contact.send}
      </Button>
    </form>
  );
}
