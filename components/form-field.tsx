import { CircleAlertIcon } from "lucide-react";
import { InlineAlert } from "@/components/inline-alert";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";

export const nativeSelectClass =
  "native-select h-11 w-full min-w-0 rounded-[9px] border border-line bg-card pr-9 pl-3.5 text-[15px] text-foreground outline-none transition-colors hover:border-acc-b focus-visible:border-acc focus-visible:ring-3 focus-visible:ring-acc/15 aria-invalid:border-destructive [&>option]:bg-popover [&>option]:text-popover-foreground";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="-ml-1.5 text-destructive" aria-hidden>*</span> : null}
      </Label>
      {children}
      {hint && !error?.length ? <p className="text-[12.5px] text-muted-foreground">{hint}</p> : null}
      {error?.length ? (
        <p id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
          <CircleAlertIcon className="size-3.5 shrink-0" aria-hidden />
          {error.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.ok || !state.message) return null;
  return (
    <InlineAlert tone="bad" role="alert">
      {state.message}
    </InlineAlert>
  );
}

/** Uppercase section divider used inside long forms. */
export function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-xs font-semibold tracking-[0.06em] text-ink2 uppercase after:h-px after:flex-1 after:bg-line after:content-['']">
      {children}
    </div>
  );
}
