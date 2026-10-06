import type * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string | number; label: React.ReactNode };

// Radix Select reserves "" for "no value", so "All …"-style options use a sentinel.
const EMPTY = "__empty__";
const toItem = (v: string | number) => (v === "" ? EMPTY : String(v));

/**
 * Admin dropdown built on ui/select. `onValueChange` gets the option value as a
 * string ("" for an empty option), like a native <select> onChange did.
 */
export function AppSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  id?: string;
  value: string | number;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const hasEmpty = options.some((o) => o.value === "");
  return (
    <Select
      // An empty value with no "" option shows the placeholder
      value={value === "" && !hasEmpty ? "" : toItem(value)}
      onValueChange={(v) => onValueChange(v === EMPTY ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={toItem(o.value)} value={toItem(o.value)}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
