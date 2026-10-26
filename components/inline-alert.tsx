import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertTone = "bad" | "ok" | "info" | "warn";

const STYLE: Record<AlertTone, string> = {
  bad: "border-bad-b bg-bad-t text-bad",
  ok: "border-ok-b bg-ok-t text-ok",
  info: "border-acc-b bg-acc-t2 text-acc-ink",
  warn: "border-warn-b bg-warn-t text-warn-ink",
};

const ICON = { bad: CircleAlertIcon, ok: CircleCheckIcon, info: InfoIcon, warn: TriangleAlertIcon };

export function InlineAlert({
  tone,
  children,
  role,
  className,
}: {
  tone: AlertTone;
  children: React.ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  const Icon = ICON[tone];
  return (
    <div role={role} className={cn("flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-sm leading-snug", STYLE[tone], className)}>
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
