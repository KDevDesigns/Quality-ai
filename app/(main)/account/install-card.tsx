"use client";

import { useSyncExternalStore } from "react";
import { DownloadIcon, ShareIcon, SquarePlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { isInstalled, isIos, isWindows } from "@/lib/pwa";

// Installing QA Hub on this device. Chrome and Edge do it in one tap; an iPhone has no such button, so it gets the steps.
// Hidden once QA Hub is running from its own icon.

type Device = "installed" | "ios" | "windows" | "other";

function readDevice(): Device {
  if (isInstalled()) return "installed";
  if (isIos()) return "ios";
  return isWindows() ? "windows" : "other";
}

const noChange = () => () => {};

export function InstallCard() {
  // Unknown on the server, so nothing shows until the browser has answered.
  const device = useSyncExternalStore<Device | null>(noChange, readDevice, () => null);
  const { canInstall, install } = useInstallPrompt();
  if (device === null || device === "installed") return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install QA Hub</CardTitle>
        <CardDescription>Opens from its own icon, without the browser&apos;s address bar. It shows the same live data as this page and keeps no tickets on this device.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 text-sm">
        {device === "ios" ? (
          <ol className="grid gap-2.5">
            <li className="flex items-center gap-2">
              <span>1. In Safari, tap <strong>Share</strong></span>
              <ShareIcon className="size-4 shrink-0 text-acc-ink" aria-hidden />
            </li>
            <li className="flex items-center gap-2">
              <span>2. Tap <strong>Add to Home Screen</strong></span>
              <SquarePlusIcon className="size-4 shrink-0 text-acc-ink" aria-hidden />
            </li>
            <li>3. Open QA Hub from the new icon and sign in.</li>
          </ol>
        ) : canInstall ? (
          <Button onClick={install} className="w-fit">
            <DownloadIcon /> Install QA Hub
          </Button>
        ) : (
          <p className="text-muted-foreground">If QA Hub is already installed, open it from its icon. If not, look for <strong>Install</strong> or <strong>Add to Home screen</strong> in your browser&apos;s menu.</p>
        )}
        {device === "windows" ? (
          <p className="text-muted-foreground">
            To start it with your PC: after installing, open <strong>edge://apps</strong> in Edge or <strong>chrome://apps</strong> in Chrome, right-click QA Hub and choose{" "}
            <strong>Start app when you sign in</strong>. The browser then keeps running, so notifications arrive all day.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
