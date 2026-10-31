import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-line bg-card px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-acc-t text-acc" aria-hidden>
        <Icon className="size-6" />
      </span>
      <h2 className="mt-1.5 text-lg font-semibold">{title}</h2>
      {children ? <p className="max-w-md text-[0.9063rem] text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-2.5">{action}</div> : null}
    </div>
  );
}
