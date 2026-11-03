import type { PrismaClient } from "@/lib/generated/prisma/client";
import { normalizeEmail } from "@/lib/auth/store";

// Deleting an account and everything it made (Admin → Users → Delete): the tickets they filed, with every reply on
// them (other people's too), their replies and timeline entries on other tickets, their uploads, DAR and devices.
// Tickets they were only assigned to stay, unassigned. Nothing here can be undone; the nightly laptop backup is the
// only copy afterwards. Turning an account off keeps the history and is usually the better choice.

export class UserDeleteError extends Error {}

export type DeletionPreview = {
  name: string;
  email: string;
  /** Tickets they filed: deleted with everything on them. */
  tickets: number;
  /** Other people's replies on those tickets, deleted with them. */
  othersReplies: number;
  /** Their own replies anywhere. */
  replies: number;
  files: number;
  bytes: number;
};

/** Every Storage object that belongs to what the person made: files on their tickets, their uploads elsewhere, unsent uploads, their photo. */
async function theirFiles(db: Pick<PrismaClient, "attachment" | "pendingUpload" | "user">, userId: string) {
  const [attached, pending, user] = await Promise.all([
    db.attachment.findMany({ where: { OR: [{ ticket: { reporterId: userId } }, { uploaderId: userId }] }, select: { storedName: true, size: true } }),
    db.pendingUpload.findMany({ where: { uploaderId: userId }, select: { storedName: true, size: true } }),
    db.user.findUnique({ where: { id: userId }, select: { avatarName: true, avatarSize: true } }),
  ]);
  const photo = user?.avatarName ? [{ storedName: user.avatarName, size: user.avatarSize ?? 0 }] : [];
  const byName = new Map([...attached, ...pending, ...photo].map((f) => [f.storedName, f.size]));
  return [...byName].map(([storedName, size]) => ({ storedName, size }));
}

export function userDeletion(db: PrismaClient) {
  return {
    /** What a delete would remove, for the confirmation dialog. Null when the account doesn't exist. */
    async preview(userId: string): Promise<DeletionPreview | null> {
      const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      if (!user) return null;
      const [tickets, othersReplies, replies, files] = await Promise.all([
        db.ticket.count({ where: { reporterId: userId } }),
        db.ticketComment.count({ where: { ticket: { reporterId: userId }, authorId: { not: userId } } }),
        db.ticketComment.count({ where: { authorId: userId } }),
        theirFiles(db, userId),
      ]);
      return { ...user, tickets, othersReplies, replies, files: files.length, bytes: files.reduce((n, f) => n + f.size, 0) };
    },

    /**
     * Deletes the account and everything it made, all or nothing. `typedEmail` must match the account's email.
     * Returns the Storage objects to remove; the caller deletes them after this succeeds.
     */
    async deleteEverything(actor: { id: string }, userId: string, typedEmail: string): Promise<{ files: string[] }> {
      if (actor.id === userId) throw new UserDeleteError("You can't delete your own account.");
      return db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, role: true, active: true } });
        if (!user) throw new UserDeleteError("This account doesn't exist any more.");
        if (normalizeEmail(typedEmail) !== user.email) throw new UserDeleteError("Type their email exactly as shown to confirm.");
        if (user.role === "ADMIN" && user.active) {
          const otherAdmins = await tx.user.count({ where: { role: "ADMIN", active: true, id: { not: userId } } });
          if (!otherAdmins) throw new UserDeleteError("Keep at least one active admin, or nobody can manage users.");
        }

        const files = await theirFiles(tx, userId);
        // Their tickets first: replies, timeline, files and read marks go with them (cascade).
        await tx.ticket.deleteMany({ where: { reporterId: userId } });
        // Then what they left on other people's tickets, which would otherwise block deleting the account.
        await tx.attachment.deleteMany({ where: { uploaderId: userId } });
        await tx.ticketComment.deleteMany({ where: { authorId: userId } });
        await tx.ticketEvent.deleteMany({ where: { actorId: userId } });
        // Sessions, devices, DAR, module membership and unsent uploads cascade; assignments become unassigned.
        await tx.user.delete({ where: { id: userId } });
        return { files: files.map((f) => f.storedName) };
      });
    },
  };
}
