import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import { dummyPasswordHash, hashPassword, verifyPassword } from "./password";
import type { Role } from "./permissions";

// Prisma glue for accounts and sessions. Takes the client as a parameter so tests can run it against a throwaway SQLite file.

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
/** A session is pushed back to the full TTL once less than this is left, so active users stay signed in. */
const SLIDE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = { id: string; name: string; email: string; role: Role; mustChangePassword: boolean };

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const userSelect = { id: true, name: true, email: true, role: true, mustChangePassword: true, active: true } as const;

export function authStore(db: PrismaClient, now: () => Date = () => new Date()) {
  return {
    /** Returns the user only for a correct password on an active account. Unknown emails take the same time. */
    async checkCredentials(email: string, password: string): Promise<SessionUser | null> {
      const user = await db.user.findUnique({ where: { email: normalizeEmail(email) }, select: { ...userSelect, passwordHash: true } });
      const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyPasswordHash()));
      if (!user || !ok || !user.active) return null;
      return toSessionUser(user);
    },

    /** Creates a session and returns the raw token for the cookie. Only its hash is stored. */
    async createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
      const token = newToken();
      const expiresAt = new Date(now().getTime() + SESSION_TTL_MS);
      await db.session.deleteMany({ where: { userId, expiresAt: { lte: now() } } });
      await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
      return { token, expiresAt };
    },

    async resolveSession(token: string): Promise<SessionUser | null> {
      if (!token) return null;
      const id = hashToken(token);
      const s = await db.session.findUnique({ where: { id }, include: { user: { select: userSelect } } });
      if (!s) return null;
      const t = now().getTime();
      if (s.expiresAt.getTime() <= t || !s.user.active) {
        await db.session.deleteMany({ where: { id } });
        return null;
      }
      if (s.expiresAt.getTime() - t < SLIDE_AFTER_MS) {
        await db.session.update({ where: { id }, data: { expiresAt: new Date(t + SESSION_TTL_MS) } });
      }
      return toSessionUser(s.user);
    },

    async deleteSession(token: string) {
      await db.session.deleteMany({ where: { id: hashToken(token) } });
    },

    /** Signs a user out everywhere, optionally keeping the session they are using now. */
    async deleteUserSessions(userId: string, keepToken?: string) {
      await db.session.deleteMany({ where: { userId, ...(keepToken ? { id: { not: hashToken(keepToken) } } : {}) } });
    },

    async setPassword(userId: string, password: string, mustChange: boolean) {
      await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), mustChangePassword: mustChange } });
    },

    async verifyUserPassword(userId: string, password: string): Promise<boolean> {
      const u = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      return u ? verifyPassword(password, u.passwordHash) : false;
    },

    async createUser(input: { name: string; email: string; role: Role; password: string; mustChangePassword?: boolean }) {
      return db.user.create({
        data: {
          name: input.name,
          email: normalizeEmail(input.email),
          role: input.role,
          passwordHash: await hashPassword(input.password),
          mustChangePassword: input.mustChangePassword ?? true,
        },
        select: { id: true },
      });
    },

    /** True when the change would leave no active admin, which would lock everyone out of user management. */
    async wouldRemoveLastAdmin(userId: string, next: { role: Role; active: boolean }): Promise<boolean> {
      if (next.role === "ADMIN" && next.active) return false;
      const others = await db.user.count({ where: { role: "ADMIN", active: true, id: { not: userId } } });
      return others === 0;
    },
  };
}

function toSessionUser(u: { id: string; name: string; email: string; role: string; mustChangePassword: boolean }): SessionUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role as Role, mustChangePassword: u.mustChangePassword };
}
