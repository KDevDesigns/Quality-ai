// The Users tab's filters in Admin → Users: search, role, module and status. Pure, unit-tested.

export type UserStatus = "active" | "temp" | "off";

export type FilterableUser = {
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  /** The modules they belong to, by top-level module name (a sub-module counts for its module). */
  modules: string[];
};

export type UserFilters = { q: string; role: string; module: string; status: string };

export const STATUS_LABELS: Record<UserStatus, string> = { active: "Active", temp: "Temporary password", off: "Turned off" };

/** Turned off first, then a temporary password still to change, otherwise active. */
export function userStatus(u: Pick<FilterableUser, "active" | "mustChangePassword">): UserStatus {
  if (!u.active) return "off";
  return u.mustChangePassword ? "temp" : "active";
}

/**
 * The users that match. Search looks in the nickname and email, ignoring case. `module: "none"` keeps people in no
 * module. An empty filter keeps everyone.
 */
export function filterUsers<T extends FilterableUser>(users: T[], f: UserFilters): T[] {
  const q = f.q.trim().toLowerCase();
  return users.filter(
    (u) =>
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!f.role || u.role === f.role) &&
      (!f.module || (f.module === "none" ? u.modules.length === 0 : u.modules.includes(f.module))) &&
      (!f.status || userStatus(u) === f.status),
  );
}
