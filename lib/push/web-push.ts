import webpush from "web-push";
import type { PushSender } from "./send";

/**
 * The real sender, signed with QA Hub's VAPID keys (they prove to the push services that a push comes from us).
 * null when the keys aren't set, so a PC or deploy without them simply sends nothing.
 */
export function webPushSender(env: Record<string, string | undefined> = process.env): PushSender | null {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return null;
  const vapidDetails = { subject, publicKey, privateKey };
  return async (sub, payload, opts) => {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload, { TTL: opts.ttl, topic: opts.topic, urgency: "normal", vapidDetails });
  };
}
