// Notification sounds. An open QA Hub tab plays the person's tone when a device notification arrives (the notification
// itself is then silent); with QA Hub closed the device's own notification sound plays, because browsers can't attach a
// custom sound to a web notification.

export const PRESET_TONES = Array.from({ length: 11 }, (_, i) => ({ id: `tone-${i + 1}`, label: `Tone ${i + 1}` }));

export const DEFAULT_TONE = "tone-1";

export type ToneId = string;

/** Valid choices: a preset or "silent". */
export function isTone(id: string): boolean {
  return id === "silent" || PRESET_TONES.some((t) => t.id === id);
}

/** What the browser plays for a tone, or null for none. */
export function toneSrc(id: ToneId): string | null {
  return PRESET_TONES.some((t) => t.id === id) ? `/sounds/${id}.mp3` : null;
}

/** The tone to send in a push: an unknown value falls back to the default. */
export function effectiveTone(u: { notifyTone: string }): ToneId {
  return isTone(u.notifyTone) ? u.notifyTone : DEFAULT_TONE;
}
