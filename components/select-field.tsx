"use client";

import { Fragment } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

// A dropdown in place of a native <select>: give it options (or groups of options) and a `name`, and it posts its
// value with the form. Controlled (`value` + `onValueChange`) or not (`defaultValue`). "" is a normal value, used for
// "Any" or "Not set" choices, as with the native selects it replaces.

export type SelectOption = { value: string; label: string };
export type SelectOptionGroup = { label?: string; options: SelectOption[] };

export function SelectField({
  id,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  groups,
  size,
  className,
  disabled,
  required,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  size?: "sm" | "default";
  className?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
}) {
  const all = groups ?? [{ options: options ?? [] }];
  const items = all.flatMap((g) => g.options);
  return (
    <Select
      name={name}
      items={items}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(v) => onValueChange?.((v as string | null) ?? "")}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger id={id} size={size} className={className} aria-label={ariaLabel} aria-invalid={ariaInvalid}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {all.map((g, i) => (
          <Fragment key={g.label ?? i}>
            {g.label ? (
              <SelectGroup>
                <SelectLabel>{g.label}</SelectLabel>
                {g.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ) : (
              g.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))
            )}
          </Fragment>
        ))}
      </SelectContent>
    </Select>
  );
}
