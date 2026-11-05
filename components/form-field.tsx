import { CircleAlertIcon } from "lucide-react";
import { InfoTip } from "@/components/info-tip";
import { InlineAlert } from "@/components/inline-alert";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/form";
import { cn } from "@/lib/utils";


export function Field({
  label,
  htmlFor,
  error,
  hint,
  tip,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: React.ReactNode;
  /** An explanation behind an info button on laptops. Phones have no hover, so there it stays as text under the field. */
  tip?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const heading = (
    <Label htmlFor={htmlFor}>
      {label}
      {required ? <span className="-ml-1.5 text-destructive-text" aria-hidden>*</span> : null}
    </Label>
  );
  return (
    <div className={cn("grid content-start gap-2", className)}>
      {tip ? (
        <div className="flex items-center gap-1.5">
          {heading}
          <InfoTip label={label} text={tip} className="max-md:hidden" />
        </div>
      ) : (
        heading
      )}
      {children}
      {hint && !error?.length ? <p className="text-[0.7813rem] text-muted-foreground">{hint}</p> : null}
      {tip && !error?.length ? <p className="text-[0.7813rem] text-muted-foreground md:hidden">{tip}</p> : null}
      {error?.length ? (
        <p id={`${htmlFor}-error`} className="flex items-center gap-1.5 text-[0.7813rem] font-medium text-destructive-text">
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
