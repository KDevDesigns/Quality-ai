import {
  FileSlidersIcon,
  FileSpreadsheetIcon,
  LayoutDashboardIcon,
  TicketIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { can, type Role } from "@/lib/auth/permissions";

/** `soon` marks an item that is planned but not built yet; it renders disabled with that badge. */
export type NavItem = { href: string; label: string; icon: LucideIcon; soon?: string };
export type NavGroupKey = "tickets" | "admin";
export type NavGroup = { key: NavGroupKey; label: string; items: NavItem[] };

export const TICKETS_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/tickets", label: "Tickets", icon: TicketIcon },
  { href: "/team", label: "Team & modules", icon: UsersRoundIcon },
];

/** QA testers and admins: their own Daily Accomplishment Report. */
export const DAR_NAV: NavItem = { href: "/dar", label: "My DAR", icon: FileSpreadsheetIcon };

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/admin/dar", label: "DAR template", icon: FileSlidersIcon },
];

const PAGES: NavItem[] = [{ href: "/account", label: "My account", icon: UsersIcon }];

export function navGroups(role: Role | null): NavGroup[] {
  const tickets = can(role ? { role } : null, "dar.use") ? [...TICKETS_NAV, DAR_NAV] : TICKETS_NAV;
  const groups: NavGroup[] = [{ key: "tickets", label: "Tickets", items: tickets }];
  if (role === "ADMIN") groups.push({ key: "admin", label: "Admin", items: ADMIN_NAV });
  return groups;
}

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

/** The nav entry for the current path, for the breadcrumb. */
export function currentNav(pathname: string): { item: NavItem; group: NavGroupKey | null } {
  const all: [NavGroupKey | null, NavItem[]][] = [["tickets", [...TICKETS_NAV, DAR_NAV]], ["admin", ADMIN_NAV], [null, PAGES]];
  for (const [group, items] of all) {
    const item = items.find((n) => n.href !== "/" && isActive(pathname, n.href));
    if (item) return { item, group };
  }
  return { item: TICKETS_NAV[0], group: "tickets" };
}
