import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({ section, heading, body }: { section: string; heading: string; body: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">{section}</p>
        <h1 className="mt-1 text-2xl font-semibold text-primary">{heading}</h1>
        <p className="mt-2 text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
