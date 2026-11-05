import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KeyRoundIcon } from "lucide-react";
import { AvatarUpload } from "@/components/avatar-upload";
import { InfoTip } from "@/components/info-tip";
import { PageHeader } from "@/components/page-header";
import { AccountSkeleton } from "@/components/skeletons";
import { UserAvatar } from "@/components/user-avatar";
import { Card } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { pushStore } from "@/lib/push/store";
import { AccountTabs } from "./account-tabs";
import { InstallCard } from "./install-card";
import { DeviceNotificationsCard, ToneCard, WorkHoursCard } from "./notifications-card";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

const WAVES = [
  "M0 70Q400 20 800 70T1600 70T2400 70T3200 70V150H0Z",
  "M0 96Q400 56 800 96T1600 96T2400 96T3200 96V150H0Z",
  "M0 120Q400 92 800 120T1600 120T2400 120T3200 120V150H0Z",
];

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
  const role = ROLE_LABELS[user.role];

  const nameBlock = (
    <div className="grid min-w-0 gap-1.5 md:ml-3.5">
      <h2 className="truncate text-[1.625rem] leading-tight font-semibold max-md:text-xl" title={user.name}>{user.name}</h2>
      <p className="text-[0.9375rem] text-ink2 wrap-anywhere">
        {role} · <span className="font-mono">{user.email}</span>
      </p>
    </div>
  );

  return (
    <div className="grid gap-5">
      {user.mustChangePassword ? (
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-pending-border bg-pending-bg px-4 py-3 text-sm text-pending-text">
          <KeyRoundIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          You signed in with a temporary password. Choose your own password to continue.
        </div>
      ) : null}

      {/* The banner: your photo, name, role and email on a tinted band with QA Hub's waves, in your theme colour. */}
      <section aria-label="Your profile" className="relative overflow-hidden rounded-2xl border border-acc-b bg-acc-t2 p-[1.875rem] shadow-(--shadow-card) max-md:p-5">
        <svg aria-hidden viewBox="0 0 3200 150" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-acc">
          {WAVES.map((d, i) => (
            <path key={d} d={d} fill="currentColor" opacity={0.05 + i * 0.04} />
          ))}
        </svg>
        <div className="relative">
          {user.mustChangePassword ? (
            // A photo can be added once they have their own password (uploads are closed during the forced change).
            <div className="flex items-center gap-3.5">
              <UserAvatar person={user} className="size-[8.25rem] text-[2.75rem] ring-4 ring-card max-md:size-20 max-md:text-2xl" />
              {nameBlock}
            </div>
          ) : (
            <AvatarUpload person={user} avatarClassName="size-[8.25rem] text-[2.75rem] ring-4 ring-card max-md:size-20 max-md:text-2xl">
              {nameBlock}
            </AvatarUpload>
          )}
        </div>
      </section>

      <AccountTabs
        initial="profile"
        tabs={[
          {
            id: "profile",
            label: "Profile",
            content: (
              <Card className="p-5">
                <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <dt className="text-body2">Nickname</dt>
                  <dd className="font-medium">{user.name}</dd>
                  <dt className="text-body2">Email</dt>
                  <dd className="font-mono wrap-anywhere">{user.email}</dd>
                  <dt className="text-body2">Role</dt>
                  <dd className="font-medium">{role}</dd>
                </dl>
                <p className="mt-3 text-[0.8125rem] text-muted-foreground">
                  {user.mustChangePassword ? "Choose your own password first, then you can add a photo. " : "Click your photo above to change it. Everyone in QA Hub sees it. "}
                  An admin can change your nickname, email or role under Admin → Users.
                </p>
                <hr className="my-5 border-line2" />
                <section id="change-password" aria-labelledby="change-password-title" className="scroll-mt-28">
                  <h3 id="change-password-title" className="flex items-center gap-1.5 text-lg font-semibold">
                    Change password
                    <InfoTip label="Change password" text="At least 10 characters. Changing it signs you out on your other devices." />
                  </h3>
                  <div className="mt-3">
                    <PasswordForm />
                  </div>
                </section>
              </Card>
            ),
          },
          {
            id: "notifications",
            label: "Notifications",
            content: (
              <div className="grid gap-5">
                <DeviceNotificationsCard />
                <InstallCard />
              </div>
            ),
          },
          { id: "sound", label: "Sound", content: <ToneCard initial={{ ...tone, previews }} /> },
          { id: "hours", label: "Work hours", content: <WorkHoursCard initial={workHours} /> },
        ]}
      />
    </div>
  );
}
