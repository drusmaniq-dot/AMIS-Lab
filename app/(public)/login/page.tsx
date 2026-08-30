import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function LoginPage() {
  const { dict } = await getDictionary();

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{dict.auth.loginTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {dict.auth.notMember}{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              {dict.auth.requestAccount}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
