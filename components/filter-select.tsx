"use client";

import { useRef } from "react";
import { SelectField, type SelectOption, type SelectOptionGroup } from "@/components/select-field";

/**
 * A filter (Tickets, Team) that applies as soon as a choice is made, by submitting its GET form. Without scripts
 * the form still works through its own submit button.
 */
export function FilterSelect(props: {
  id: string;
  name: string;
  defaultValue: string;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
}) {
  const box = useRef<HTMLSpanElement>(null);
  return (
    <span ref={box} className="contents">
      <SelectField
        {...props}
        // The select's hidden input updates after this call, so the form is sent on the next tick.
        onValueChange={() => window.setTimeout(() => box.current?.closest("form")?.requestSubmit(), 0)}
      />
    </span>
  );
}
