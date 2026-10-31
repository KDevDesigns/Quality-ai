import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SPLASH_SCRIPT } from "@/lib/splash";
import { ACCENT_SCRIPT } from "@/lib/theme";
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
  title: { default: "QA Hub", template: "%s · QA Hub" },
  description: "QA tickets and QA↔developer communication for the in-house ERP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme scripts set the `dark` class and data-accent on <html> before React loads, so the server markup
    // differs from the first client render on purpose.
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCENT_SCRIPT }} />
        {/* Marks the first visit this session, so the QA Hub preloader shows from the first frame (components/app-splash.tsx). */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
