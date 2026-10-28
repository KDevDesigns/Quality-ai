import {
  BoxesIcon,
  ClipboardListIcon,
  CompassIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GitCompareIcon,
  InboxIcon,
  LayoutDashboardIcon,
  PlayIcon,
  ServerIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SlidersHorizontalIcon,
  TicketIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth/permissions";

/** `soon` marks an item that is planned but not built yet; it renders disabled with that badge. */
export type NavItem = { href: string; label: string; icon: LucideIcon; soon?: string };
export type NavGroupKey = "tickets" | "admin" | "ai";
export type NavGroup = { key: NavGroupKey; label: string; items: NavItem[] };

export const TICKETS_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/tickets", label: "Tickets", icon: TicketIcon, soon: "Next" },
  { href: "/inbox", label: "My inbox", icon: InboxIcon, soon: "Next" },
  { href: "/team", label: "Team & modules", icon: UsersRoundIcon },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: UsersIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/admin/workspace", label: "Workspace", icon: SlidersHorizontalIcon },
];

/** Hidden unless an admin turns the AI workbench on in Admin → Workspace. */
export const AI_NAV: NavItem[] = [
  { href: "/environments", label: "Environments", icon: ServerIcon },
  { href: "/modules", label: "AI modules", icon: BoxesIcon },
  { href: "/processes", label: "Processes", icon: WorkflowIcon },
  { href: "/risks", label: "Risk register", icon: ShieldAlertIcon },
  { href: "/test-design", label: "Test design", icon: ClipboardListIcon },
  { href: "/settings", label: "AI settings", icon: SettingsIcon },
  { href: "/data", label: "Data & oracles", icon: DatabaseIcon, soon: "P4" },
  { href: "/runs", label: "Runs", icon: PlayIcon, soon: "P5" },
  { href: "/review", label: "Review", icon: GitCompareIcon, soon: "P7" },
  { href: "/explore", label: "Explore", icon: CompassIcon, soon: "P8" },
  { href: "/reports", label: "Reports", icon: FileTextIcon, soon: "P9" },
];

const PAGES: NavItem[] = [{ href: "/account", label: "My account", icon: UsersIcon }];

export function navGroups(role: Role | null, aiWorkbench: boolean): NavGroup[] {
  const groups: NavGroup[] = [{ key: "tickets", label: "Tickets", items: TICKETS_NAV }];
  if (role === "ADMIN") groups.push({ key: "admin", label: "Admin", items: ADMIN_NAV });
  if (role === "ADMIN" && aiWorkbench) groups.push({ key: "ai", label: "AI workbench", items: AI_NAV });
  return groups;
}

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

/** The nav entry for the current path, for the breadcrumb. */
export function currentNav(pathname: string): { item: NavItem; group: NavGroupKey | null } {
  const all: [NavGroupKey | null, NavItem[]][] = [["tickets", TICKETS_NAV], ["admin", ADMIN_NAV], ["ai", AI_NAV], [null, PAGES]];
  for (const [group, items] of all) {
    const item = items.find((n) => n.href !== "/" && isActive(pathname, n.href));
    if (item) return { item, group };
  }
  return { item: TICKETS_NAV[0], group: "tickets" };
}
