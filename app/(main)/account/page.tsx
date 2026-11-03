import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BellRingIcon, ClockIcon, KeyRoundIcon, UserRoundIcon, Volume2Icon } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { InlineAlert } from "@/components/inline-alert";
import { PageHeader } from "@/components/page-header";
import { AccountSkeleton } from "@/components/skeletons";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pushStore } from "@/lib/push/store";
import { AccountTabs } from "./account-tabs";
import { InstallCard } from "./install-card";
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

function ProfileName({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="grid min-w-0 gap-1">
      <CardTitle>{name}</CardTitle>
      <CardDescription className="wrap-anywhere">{detail}</CardDescription>
    </div>
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
                <CardHeader>
                  {user.mustChangePassword ? (
                    <div className="flex items-center gap-3.5">
                      <UserAvatar person={user} className="size-14 text-xl" />
                      <ProfileName name={user.name} detail={`${user.email} · ${ROLE_LABELS[user.role]}`} />
                    </div>
                  ) : (
                    <AvatarUpload person={user} avatarClassName="size-14 text-xl">
                      <ProfileName name={user.name} detail={`${user.email} · ${ROLE_LABELS[user.role]}`} />
                    </AvatarUpload>
                  )}
                </CardHeader>
                <CardContent className="grid gap-1 text-sm text-muted-foreground">
                  <p>{user.mustChangePassword ? "Choose your own password first, then you can add a photo." : "Click your picture to change your photo. Everyone in QA Hub sees it."}</p>
                  <p>An admin can change your nickname, email or role under Admin → Users.</p>
                </CardContent>
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
          {
            id: "notifications",
            label: "Notifications",
            hint: "Alerts on this device",
            icon: <BellRingIcon />,
            content: (
              <div className="grid gap-5">
                <DeviceNotificationsCard />
                <InstallCard />
              </div>
            ),
          },
          { id: "sound", label: "Sound", hint: "Tone and message previews", icon: <Volume2Icon />, content: <ToneCard initial={{ ...tone, previews }} /> },
          { id: "hours", label: "Work hours", hint: "When notifications may ring", icon: <ClockIcon />, content: <WorkHoursCard initial={workHours} /> },
        ]}
      />
    </div>
  );
}
