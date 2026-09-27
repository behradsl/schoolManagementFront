"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ComponentPropsWithoutRef, ElementRef, HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-navy/40 data-[state=open]:opacity-100 data-[state=closed]:opacity-0", className)}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "right" | "left";
  }
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 z-50 flex h-full w-[min(20rem,88vw)] flex-col bg-navy text-white shadow-xl transition-transform duration-200 ease-out data-[state=open]:translate-x-0",
        side === "right" && "start-0 border-e border-white/10 data-[state=closed]:translate-x-full",
        side === "left" && "end-0 border-s border-white/10 data-[state=closed]:-translate-x-full",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className="absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
        aria-label="بستن منو"
      >
        <X size={18} />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-white/10 px-5 py-6 pe-12", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-lg font-bold", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-xs text-white/70", className)} {...props} />;
}
