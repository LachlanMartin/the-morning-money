import { redirect } from "next/navigation";
import { isLocalMode } from "@/lib/app-mode";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLocalMode()) redirect("/dashboard");
  return <>{children}</>;
}
