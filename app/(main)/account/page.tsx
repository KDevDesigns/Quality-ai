import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BellRingIcon, ClockIcon, KeyRoundIcon, UserRoundIcon, Volume2Icon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { PageHeader } from "@/components/page-header";
import { AccountSkeleton } from "@/components/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pushStore } from "@/lib/push/store";
import { AccountTabs } from "./account-tabs";
import { DeviceNotificationsCard, ToneCard, WorkHoursCard } from "./notifications-card";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <>
      {/* On a phone the top bar names the page and Settings lists the sections. */}
      <div className="max-md:hidden">
        <PageHeader title="My account" description="Your profile, password and how QA Hub notifies you." />
      </div>
      <Suspense fallback={<AccountSkeleton />}>
        <AccountBody />
      </Suspense>
    </>
  );
}

async function AccountBody() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const push = pushStore(db);
  const [workHours, tone, previews] = await Promise.all([push.workHours(user.id), push.tone(user.id), push.previews(user.id)]);

  return (
    <div className="grid gap-5">
      {user.mustChangePassword ? (
        <InlineAlert tone="warn" role="status">
          You signed in with a temporary password. Choose your own password to continue.
        </InlineAlert>
      ) : null}
      <AccountTabs
        initial={user.mustChangePassword ? "password" : "profile"}
        tabs={[
          {
            id: "profile",
            label: "Profile",
            hint: "Your name, email and role",
            icon: <UserRoundIcon />,
            content: (
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-acc-t text-xl font-semibold text-acc-ink" aria-hidden>
                    {user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="grid gap-1">
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>
                      {user.email} · {ROLE_LABELS[user.role]}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">An admin can change your nickname, email or role under Admin → Users.</CardContent>
              </Card>
            ),
          },
          {
            id: "password",
            label: "Password",
            hint: "Change your password",
            icon: <KeyRoundIcon />,
            content: (
              <Card>
                <CardHeader>
                  <CardTitle>Change password</CardTitle>
                  <CardDescription>At least 10 characters. Changing it signs you out on your other devices.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PasswordForm />
                </CardContent>
              </Card>
            ),
          },
          { id: "notifications", label: "Notifications", hint: "Alerts on this device", icon: <BellRingIcon />, content: <DeviceNotificationsCard /> },
          { id: "sound", label: "Sound", hint: "Tone and message previews", icon: <Volume2Icon />, content: <ToneCard initial={{ ...tone, previews }} /> },
          { id: "hours", label: "Work hours", hint: "When notifications may ring", icon: <ClockIcon />, content: <WorkHoursCard initial={workHours} /> },
        ]}
      />
    </div>
  );
}
