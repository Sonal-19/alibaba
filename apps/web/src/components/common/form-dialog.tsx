import type * as React from "react";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Dialog for long forms: full-screen page on phones (sticky header and
 * footer, scrolling body), centred dialog from `sm` up.
 *
 * <FormDialogContent>
 *   <FormDialogHeader>…</FormDialogHeader>
 *   <FormDialogBody>…fields…</FormDialogBody>
 *   <FormDialogFooter>…buttons…</FormDialogFooter>
 * </FormDialogContent>
 *
 * When the footer submits a <form>, either wrap body + footer in
 * `<form className="flex min-h-0 flex-1 flex-col">` or use `form="id"` on the button.
 */
export function FormDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      className={cn(
        "flex flex-col gap-0 p-0 sm:max-h-[92dvh]",
        "max-sm:inset-0 max-sm:h-dvh max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0",
        "max-sm:data-[state=open]:slide-in-from-bottom-8 max-sm:data-[state=open]:zoom-in-100 max-sm:data-[state=closed]:slide-out-to-bottom-8 max-sm:data-[state=closed]:zoom-out-100",
        className,
      )}
      {...props}
    />
  );
}

export function FormDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  return (
    <DialogHeader
      className={cn(
        "shrink-0 border-b px-4 py-3 pr-12 text-left sm:px-6 sm:py-4",
        className,
      )}
      {...props}
    />
  );
}

export function FormDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}

/** Sticky action bar; on phones the buttons share the width equally. */
export function FormDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  return (
    <DialogFooter
      className={cn(
        "shrink-0 gap-2 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4",
        "max-sm:flex-row max-sm:[&>*]:h-11 max-sm:[&>*]:flex-1",
        className,
      )}
      {...props}
    />
  );
}
