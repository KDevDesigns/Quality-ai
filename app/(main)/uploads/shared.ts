import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";

export const fail = (status: number, error: string) => Response.json({ error }, { status });

/** The signed-in person, if they may attach files to tickets. Route handlers answer with a status, not a redirect. */
export async function uploader() {
  const user = await getCurrentUser();
  return user && !user.mustChangePassword && can(user, "tickets.comment") ? user : null;
}
