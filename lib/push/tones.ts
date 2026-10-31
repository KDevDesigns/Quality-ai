// Notification sounds. An open QA Hub tab plays the person's tone when a device notification arrives (the notification
// itself is then silent); with QA Hub closed the device's own notification sound plays, because browsers can't attach a
// custom sound to a web notification.

export const PRESET_TONES = Array.from({ length: 11 }, (_, i) => ({ id: `tone-${i + 1}`, label: `Tone ${i + 1}` }));

export const DEFAULT_TONE = "tone-1";

export type ToneId = string;

/** Valid choices: a preset, "silent", or "custom" when the person has uploaded one. */
export function isTone(id: string, hasCustom: boolean): boolean {
  return id === "silent" || (id === "custom" && hasCustom) || PRESET_TONES.some((t) => t.id === id);
}

/** What the browser plays for a tone, or null for none. "custom" goes through a route that checks the session. */
export function toneSrc(id: ToneId): string | null {
  if (id === "custom") return "/tones/mine";
  return PRESET_TONES.some((t) => t.id === id) ? `/sounds/${id}.mp3` : null;
}

/** The tone to send in a push: a saved "custom" without a file (or an unknown value) falls back to the default. */
export function effectiveTone(u: { notifyTone: string; customTone: string | null }): ToneId {
  return isTone(u.notifyTone, !!u.customTone) ? u.notifyTone : DEFAULT_TONE;
}
