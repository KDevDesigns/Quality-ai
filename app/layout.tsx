import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "QA AI", template: "%s · QA AI" },
  description: "Local QA workbench for the in-house ERP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>
          <SidebarProvider style={{ "--sidebar-width": "17.5rem" } as React.CSSProperties}>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <AppTopbar />
              <main className="mx-auto w-full max-w-[1320px] flex-1 space-y-6 px-4 py-7 md:px-10">{children}</main>
              <footer className="flex h-[52px] shrink-0 items-center justify-center border-t border-line2 px-4 text-center text-[13px] tracking-[0.02em] text-muted-foreground">
                Davao City Water District · QA workbench for the in-house ERP
              </footer>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
