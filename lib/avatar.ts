// How a person looks in QA Hub: their profile photo, or their initials in a colour pair of their own, so that a conversation
// shows at a glance who said what. Pure functions, unit-tested.

/**
 * Background and text pairs, the same in light and dark mode. In this order, so people who sign up one after another get very
 * different pairs: a dark one, then a pale one of another hue.
 */
export const AVATAR_COLORS = [
  { background: "#1d4ed8", color: "#dbeafe" },
  { background: "#fde68a", color: "#78350f" },
  { background: "#0f766e", color: "#ccfbf1" },
  { background: "#fbcfe8", color: "#831843" },
  { background: "#7e22ce", color: "#f3e8ff" },
  { background: "#bbf7d0", color: "#14532d" },
  { background: "#b91c1c", color: "#fee2e2" },
  { background: "#cbd5e1", color: "#1e293b" },
  { background: "#92400e", color: "#fef3c7" },
  { background: "#bfdbfe", color: "#1e3a8a" },
  { background: "#be185d", color: "#fce7f3" },
  { background: "#99f6e4", color: "#134e4a" },
  { background: "#166534", color: "#dcfce7" },
  { background: "#e9d5ff", color: "#581c87" },
  { background: "#334155", color: "#e2e8f0" },
  { background: "#fecaca", color: "#7f1d1d" },
] as const;

/** A person's pair, from the number their account was given. Differs from everyone else's until all the pairs are in use. */
export function avatarColors(n: number): { background: string; color: string } {
  const count = AVATAR_COLORS.length;
  return AVATAR_COLORS[((n - 1) % count + count) % count];
}

/** Who an avatar is of. */
export type AvatarPerson = { id: string; name: string; avatarColor: number; avatarName: string | null };

/**
 * Where a person's photo is served from (app/(main)/files/avatar), or null when they have none. A new photo has a new random
 * file name, and that is in the address, so browsers don't keep showing the old one.
 */
export function avatarSrc(p: Pick<AvatarPerson, "id" | "avatarName">): string | null {
  if (!p.avatarName) return null;
  return `/files/avatar/${p.id}?v=${p.avatarName.split("/").at(-1)?.split(".")[0]}`;
}

/** A photo's width and height once saved: enough for the largest avatar on a sharp screen, and very little to store. */
export const AVATAR_PX = 256;

/** The biggest photo accepted. It's only read in the browser, and only the small copy is uploaded, so this is well above the upload limit. */
export const AVATAR_SOURCE_MAX_BYTES = 40 * 1024 * 1024;

/** The largest centred square in an image, so a photo of any shape fills the circle without stretching. */
export function centerSquare(width: number, height: number): { x: number; y: number; size: number } {
  const size = Math.min(width, height);
  return { x: (width - size) / 2, y: (height - size) / 2, size };
}
