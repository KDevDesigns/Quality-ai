import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { InlineAlert } from "@/components/inline-alert";
import { LoadingBlock, PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <>
      <PageHeader title="My account" />
      <Suspense fallback={<LoadingBlock />}>
        <AccountBody />
      </Suspense>
    </>
  );
}

async function AccountBody() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      {user.mustChangePassword ? (
        <InlineAlert tone="warn" role="status" className="lg:col-span-2">
          You signed in with a temporary password. Choose your own password to continue.
        </InlineAlert>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
          <CardDescription>{user.email} · {ROLE_LABELS[user.role]}</CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>At least 10 characters. Changing it signs you out on your other devices.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
