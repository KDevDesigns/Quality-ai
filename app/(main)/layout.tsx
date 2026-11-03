import { Suspense } from "react";
import { AppSplash } from "@/components/app-splash";
import { AppSidebar, AppSidebarShell, type SidebarUser } from "@/components/app-sidebar";
import { AppTopbar, AppTopbarShell } from "@/components/app-topbar";
import { BottomNav } from "@/components/bottom-nav";
import { NotificationsProvider } from "@/components/notifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/session";

import { PushPrompt } from "./push-prompt";
import { ToneListener } from "./tone-listener";

// The session is read behind Suspense (Cache Components), so the chrome streams in without holding up the page.
// This only shapes the navigation; each page and action still checks access itself.

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <NotificationsProvider>
      <AppSplash />
      <SidebarProvider style={{ "--sidebar-width": "17.5rem", "--sidebar-width-icon": "3.5625rem" } as React.CSSProperties}>
        <Suspense fallback={<AppSidebarShell />}>
          <SessionSidebar />
        </Suspense>
        <SidebarInset className="min-w-0">
          <Suspense fallback={<AppTopbarShell />}>
            <SessionTopbar />
          </Suspense>
          <main data-main className="page-enter mx-auto w-full max-w-[82.5rem] flex-1 space-y-6 px-4 py-7 max-md:overflow-x-clip max-md:px-5 max-md:py-5 md:px-10">
            {children}
          </main>
          <footer className="flex h-[3.25rem] shrink-0 items-center justify-center border-t border-line2 px-4 text-center text-[0.8125rem] tracking-[0.02em] text-muted-foreground max-md:hidden">
            Davao City Water District · QA Hub for the in-house ERP
          </footer>
        </SidebarInset>
      </SidebarProvider>
      {/* Phones: the tab bar. It reads the URL, so it's inside Suspense too. */}
      <Suspense fallback={null}>
        <SessionBottomNav />
      </Suspense>
      {/* It reads the URL, which Cache Components only allows inside Suspense. */}
      <Suspense fallback={null}>
        <PushPrompt />
      </Suspense>
      <ToneListener />
    </NotificationsProvider>
  );
}

async function sessionUser(): Promise<SidebarUser | null> {
  const u = await getCurrentUser();
  return u ? { id: u.id, name: u.name, role: u.role, avatarColor: u.avatarColor, avatarName: u.avatarName, mustChangePassword: u.mustChangePassword } : null;
}

async function SessionSidebar() {
  return <AppSidebar user={await sessionUser()} />;
}

async function SessionTopbar() {
  return <AppTopbar user={await sessionUser()} />;
}

async function SessionBottomNav() {
  const user = await sessionUser();
  return user ? <BottomNav role={user.role} /> : null;
}
