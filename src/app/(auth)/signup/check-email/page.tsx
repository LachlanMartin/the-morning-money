import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent you a confirmation link. Click it to finish signing up.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder, or try signing up again.
        </CardContent>
      </Card>
    </div>
  );
}
