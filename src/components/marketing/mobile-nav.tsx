"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { NAV_ITEMS } from "./content";

// Built on the native <dialog> element for the same reason as the ui/Modal
// primitive: free focus trapping, Escape-to-close, and top-layer rendering.
// Kept as its own component rather than reusing <Modal> because a slide-in,
// full-height, edge-anchored drawer has a genuinely different layout than
// Modal's centered card — not a duplicate of the same UI pattern.
export function MobileNav() {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [open, setOpen] = React.useState(false);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      event.preventDefault();
      close();
    };
    const handleClose = () => close();

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [close]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      close();
    }
  };

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" aria-label="Open menu" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Site menu"
        onClick={handleBackdropClick}
        className={cn(
          // `hidden` + `open:flex` (not a bare `flex`) matters here: a
          // native <dialog> without the `open` attribute is only ever
          // hidden by the UA stylesheet's `dialog:not([open]){display:none}`
          // rule, which an unconditional `flex` utility overrides — the
          // drawer stayed visibly painted (just click-through, since it's
          // no longer in the top layer) even after close() correctly
          // cleared the `open` attribute. Scoping `flex` to `open:` keeps
          // the element genuinely hidden while closed.
          "m-0 ml-auto hidden h-dvh max-h-none w-full max-w-xs flex-col border-l border-border bg-surface-elevated p-0 text-text open:flex",
          "backdrop:bg-background/80 backdrop:backdrop-blur-sm"
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-small font-semibold text-text">Menu</span>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={close}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={close}
              className={cn(
                "rounded-md px-3 py-2.5 text-body font-medium text-text transition-colors hover:bg-surface",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-border p-4">
          <Link href="/login" onClick={close} className={buttonVariants({ variant: "outline" })}>
            Login
          </Link>
          <Link href="/get-started" onClick={close} className={buttonVariants({ variant: "primary" })}>
            Get Started
          </Link>
        </div>
      </dialog>
    </div>
  );
}
