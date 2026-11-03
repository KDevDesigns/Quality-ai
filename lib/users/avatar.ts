import type { PrismaClient } from "@/lib/generated/prisma/client";

// A person's profile photo. It uploads and is checked like any other image (app/(main)/uploads), then moves from the unsent
// uploads to their account, so the nightly clean-up leaves it alone. Only ever the signed-in person's own.

export function avatarStore(db: PrismaClient) {
  return {
    /** Makes one of their own checked uploads their photo. The old photo's file to delete, or null. False when the upload isn't usable. */
    async set(userId: string, uploadId: string): Promise<{ old: string | null } | false> {
      return db.$transaction(async (tx) => {
        const upload = await tx.pendingUpload.findFirst({ where: { id: uploadId, uploaderId: userId, status: "READY", kind: "IMAGE" } });
        if (!upload) return false;
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarName: true } });
        await tx.user.update({ where: { id: userId }, data: { avatarName: upload.storedName, avatarMime: upload.mime, avatarSize: upload.size } });
        await tx.pendingUpload.delete({ where: { id: upload.id } });
        return { old: user.avatarName };
      });
    },

    /** Removes their photo, so their colours show again. The file to delete, or null when they had none. */
    async clear(userId: string): Promise<string | null> {
      return db.$transaction(async (tx) => {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { avatarName: true } });
        if (user.avatarName) await tx.user.update({ where: { id: userId }, data: { avatarName: null, avatarMime: null, avatarSize: null } });
        return user.avatarName;
      });
    },

    /** The stored file of anyone's photo, for serving it to someone signed in. */
    async fileOf(userId: string): Promise<string | null> {
      const user = await db.user.findUnique({ where: { id: userId }, select: { avatarName: true } });
      return user?.avatarName ?? null;
    },
  };
}
