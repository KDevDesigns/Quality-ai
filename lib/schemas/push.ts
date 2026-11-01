import { z } from "zod";

/**
 * The browsers' push services. The server POSTs to a subscription's endpoint, so it only accepts these hosts: anything
 * else would let a signed-in person make the server call any URL they like.
 */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

export function isPushEndpoint(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && PUSH_HOSTS.some((h) => h.test(u.hostname));
  } catch {
    return false;
  }
}

const key = z.string().min(1).max(200);

/** What the browser's PushSubscription.toJSON() gives us. */
export const pushSubscriptionInput = z.object({
  endpoint: z.string().max(1000).refine(isPushEndpoint, "Not a browser push address"),
  keys: z.object({ p256dh: key, auth: key }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInput>;

/** "07:30" → 450 minutes after midnight. */
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a time")
  .transform((v) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3)));

/** Outside work hours and days: as usual, without sound, or nothing on the device (the OffHoursPush enum). */
export const OFF_HOURS_PUSH = ["SOUND", "SILENT", "NONE"] as const;
export type OffHoursPush = (typeof OFF_HOURS_PUSH)[number];

export const workHoursInput = z
  .object({
    offHoursPush: z.enum(OFF_HOURS_PUSH, "Pick what happens outside your work hours"),
    workStartMin: time,
    workEndMin: time,
    /** Weekdays as 0 (Sunday) to 6 (Saturday). */
    days: z.array(z.number().int().min(0).max(6)).max(7),
  })
  .refine((w) => w.workStartMin !== w.workEndMin, { message: "Start and end can't be the same", path: ["workEndMin"] })
  .refine((w) => w.offHoursPush === "SOUND" || w.days.length > 0,{ message: "Pick at least one day", path: ["days"] })
  .transform(({ days, ...w }) => ({ ...w, workDays: days.reduce((m, d) => m | (1 << d), 0) }));
export type WorkHoursInput = z.infer<typeof workHoursInput>;
