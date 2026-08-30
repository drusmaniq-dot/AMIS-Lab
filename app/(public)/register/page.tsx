import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./register-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function RegisterPage() {
  const { dict } = await getDictionary();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{dict.auth.registerTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {dict.auth.alreadyMember}{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              {dict.auth.loginButton}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
