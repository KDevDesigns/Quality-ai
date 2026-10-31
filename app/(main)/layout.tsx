import { Suspense } from "react";
import { AppSidebar, AppSidebarShell, type SidebarUser } from "@/components/app-sidebar";
import { AppTopbar, AppTopbarShell } from "@/components/app-topbar";
import { NotificationsProvider } from "@/components/notifications";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth/session";

// The session is read behind Suspense (Cache Components), so the chrome streams in without holding up the page.
// This only shapes the navigation; each page and action still checks access itself.

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <NotificationsProvider>
      <SidebarProvider style={{ "--sidebar-width": "17.5rem" } as React.CSSProperties}>
        <Suspense fallback={<AppSidebarShell />}>
          <SessionSidebar />
        </Suspense>
        <SidebarInset className="min-w-0">
          <Suspense fallback={<AppTopbarShell />}>
            <SessionTopbar />
          </Suspense>
          <main className="mx-auto w-full max-w-[1320px] flex-1 space-y-6 px-4 py-7 has-data-full-width:max-w-none md:px-10">{children}</main>
          <footer className="flex h-[52px] shrink-0 items-center justify-center border-t border-line2 px-4 text-center text-[13px] tracking-[0.02em] text-muted-foreground">
            Davao City Water District · QA Hub for the in-house ERP
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </NotificationsProvider>
  );
}

async function sessionUser(): Promise<SidebarUser | null> {
  const u = await getCurrentUser();
  return u ? { name: u.name, role: u.role } : null;
}

async function SessionSidebar() {
  return <AppSidebar user={await sessionUser()} />;
}

async function SessionTopbar() {
  return <AppTopbar user={await sessionUser()} />;
}
