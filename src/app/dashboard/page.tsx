import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Morning Money</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email}
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your watchlist</CardTitle>
          <CardDescription>
            ASX tickers you want a daily summary for. Coming next.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          You haven&apos;t added any tickers yet.
        </CardContent>
      </Card>
    </div>
  );
}
