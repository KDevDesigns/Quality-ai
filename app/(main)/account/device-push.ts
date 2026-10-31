import { base64UrlToBytes } from "@/lib/push/key";
import { toneSrc } from "@/lib/push/tones";
import { pushStatus, removePushSubscription, savePushSubscription } from "./actions";

// The browser side of device notifications, shared by the My account card and the sign-in prompt. Turning on has to
// start from a click: browsers (iPhones above all) only ask for notification permission in answer to one.

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export type DeviceState = "loading" | "unsupported" | "install" | "unset" | "blocked" | "off" | "on";

const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;

export async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function deviceState(): Promise<DeviceState> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // iPhones only offer notifications to QA Hub once it's added to the Home Screen.
    return isIos() && !isInstalled() ? "install" : "unsupported";
  }
  if (!VAPID_KEY) return "unset";
  if (Notification.permission === "denied") return "blocked";
  const sub = await currentSubscription();
  return sub && (await pushStatus(sub.endpoint)) ? "on" : "off";
}

/** Asks for permission, subscribes and saves the device. Call it straight from a click. */
export async function turnOnDevice(): Promise<{ state: DeviceState; message?: string }> {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") return { state: "blocked" };
    if (permission !== "granted") {
      // Chrome can skip the question without a word: quiet prompts, an ad blocker, or after it was closed a few times.
      return {
        state: "off",
        message: "Your browser didn't ask. If you use an ad blocker, pause it for QA Hub. Or click the icon left of the address bar, open Site settings, set Notifications to Allow, then reload and try again.",
      };
    }
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    // A subscription the server no longer has (or one made with an older key) is replaced by a fresh one.
    await (await reg.pushManager.getSubscription())?.unsubscribe();
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(VAPID_KEY) });
    const r = await savePushSubscription(sub.toJSON());
    if (!r.ok) {
      await sub.unsubscribe();
      return { state: "off", message: r.message ?? "Couldn't turn on notifications." };
    }
    return { state: "on" };
  } catch {
    // Brave turns off the push service Chromium browsers use, so subscribing fails until the person turns it on.
    if ("brave" in navigator) {
      return {
        state: "off",
        message: "Brave blocks notifications from websites by default. Open brave://settings/privacy, turn on \"Use Google services for push messaging\", restart Brave and try again.",
      };
    }
    return { state: "off", message: "Couldn't turn on notifications. Check the internet connection and try again." };
  }
}

/** Plays a tone; true if it played. Browsers refuse sound on a page nobody has clicked yet, which gives false. */
export async function playTone(tone: string): Promise<boolean> {
  const src = toneSrc(tone);
  if (!src) return false;
  try {
    await new Audio(src).play();
    return true;
  } catch {
    return false;
  }
}

export async function turnOffDevice(): Promise<void> {
  const sub = await currentSubscription();
  if (sub) {
    await removePushSubscription(sub.endpoint);
    await sub.unsubscribe();
  }
}
