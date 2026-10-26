import {
  BoxesIcon,
  BugIcon,
  ClipboardListIcon,
  CompassIcon,
  DatabaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GitCompareIcon,
  LayoutDashboardIcon,
  PlayIcon,
  ServerIcon,
  SettingsIcon,
  ShieldAlertIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/projects", label: "Projects", icon: FolderKanbanIcon },
  { href: "/environments", label: "Environments", icon: ServerIcon },
  { href: "/modules", label: "Modules", icon: BoxesIcon },
  { href: "/processes", label: "Processes", icon: WorkflowIcon },
  { href: "/risks", label: "Risk register", icon: ShieldAlertIcon },
  { href: "/test-design", label: "Test design", icon: ClipboardListIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export const LATER_NAV: { label: string; icon: LucideIcon; phase: number }[] = [
  { label: "Data & oracles", icon: DatabaseIcon, phase: 4 },
  { label: "Runs", icon: PlayIcon, phase: 5 },
  { label: "Review", icon: GitCompareIcon, phase: 7 },
  { label: "Explore", icon: CompassIcon, phase: 8 },
  { label: "Defects", icon: BugIcon, phase: 9 },
  { label: "Reports", icon: FileTextIcon, phase: 9 },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
