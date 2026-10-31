import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { PushSubscriptionInput, WorkHoursInput } from "@/lib/schemas/push";
import { DEFAULT_TONE, effectiveTone, isTone } from "./tones";

/** Each person's devices and work hours. Every call takes the user id from the session, so people manage only their own. */
export function pushStore(db: PrismaClient) {
  return {
    /** Turn on for a device. The same browser subscribing again (or after a sign-in as someone else) takes over the row. */
    async subscribe(userId: string, sub: PushSubscriptionInput, device: string): Promise<void> {
      const data = { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, device };
      await db.pushSubscription.upsert({ where: { endpoint: sub.endpoint }, create: { endpoint: sub.endpoint, ...data }, update: data });
    },

    async unsubscribe(userId: string, endpoint: string): Promise<void> {
      await db.pushSubscription.deleteMany({ where: { userId, endpoint } });
    },

    /** Whether this device is on for this person (the browser may still hold a subscription the server dropped). */
    async has(userId: string, endpoint: string): Promise<boolean> {
      return (await db.pushSubscription.count({ where: { userId, endpoint } })) > 0;
    },

    async devices(userId: string) {
      return db.pushSubscription.findMany({ where: { userId }, select: { id: true, device: true, createdAt: true, lastSentAt: true }, orderBy: { createdAt: "asc" } });
    },

    async workHours(userId: string) {
      return db.user.findUniqueOrThrow({ where: { id: userId }, select: { pushWorkHoursOnly: true, workStartMin: true, workEndMin: true, workDays: true } });
    },

    async setWorkHours(userId: string, w: WorkHoursInput): Promise<void> {
      await db.user.update({ where: { id: userId }, data: w });
    },

    /** Their sound choice, and whether they have uploaded their own. */
    async tone(userId: string): Promise<{ tone: string; hasCustom: boolean }> {
      const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { notifyTone: true, customTone: true } });
      return { tone: effectiveTone(u), hasCustom: !!u.customTone };
    },

    /** Returns false for a choice that isn't allowed (e.g. "custom" with nothing uploaded). */
    async setTone(userId: string, tone: string): Promise<boolean> {
      const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { customTone: true } });
      if (!isTone(tone, !!u.customTone)) return false;
      await db.user.update({ where: { id: userId }, data: { notifyTone: tone } });
      return true;
    },

    /** Saves their uploaded tone and picks it. Returns the old file's name, which the caller deletes from Storage. */
    async setCustomTone(userId: string, storedName: string): Promise<string | null> {
      const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { customTone: true } });
      await db.user.update({ where: { id: userId }, data: { customTone: storedName, notifyTone: "custom" } });
      return u.customTone;
    },

    /** Removes their uploaded tone (back to the default if it was picked). Returns the file's name to delete. */
    async clearCustomTone(userId: string): Promise<string | null> {
      const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { customTone: true, notifyTone: true } });
      await db.user.update({ where: { id: userId }, data: { customTone: null, ...(u.notifyTone === "custom" ? { notifyTone: DEFAULT_TONE } : {}) } });
      return u.customTone;
    },

    async previews(userId: string): Promise<boolean> {
      return (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { pushPreviews: true } })).pushPreviews;
    },

    async setPreviews(userId: string, on: boolean): Promise<void> {
      await db.user.update({ where: { id: userId }, data: { pushPreviews: on } });
    },

    async customToneName(userId: string): Promise<string | null> {
      return (await db.user.findUnique({ where: { id: userId }, select: { customTone: true } }))?.customTone ?? null;
    },
  };
}
