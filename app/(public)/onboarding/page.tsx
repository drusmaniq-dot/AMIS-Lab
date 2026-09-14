import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/permissions";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/onboarding");
  }
  if (session.user.profileComplete) {
    redirect("/dashboard");
  }
  const { dict } = await getDictionary();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{dict.auth.onboardingTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{dict.auth.onboardingBody}</p>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}
