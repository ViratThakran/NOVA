"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { MEGA_NAV_SECTIONS } from "./content";

export function MobileNav({ light = false }: { light?: boolean }) {
  const pathname = usePathname();
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

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const whatWeDoSection = MEGA_NAV_SECTIONS.find((s) => s.id === "what-we-do");
  const whoWeAreSection = MEGA_NAV_SECTIONS.find((s) => s.id === "who-we-are");
  const careersSection = MEGA_NAV_SECTIONS.find((s) => s.id === "careers");

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn("transition-colors", light && "text-white hover:bg-white/10 hover:text-white")}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      <dialog
        ref={dialogRef}
        aria-label="Site navigation"
        onClick={handleBackdropClick}
        className={cn(
          "m-0 ml-auto hidden h-dvh max-h-none w-full max-w-sm flex-col border-l border-white/[0.08] bg-[#1C1C1E] p-0 text-[#F5F5F5] open:flex",
          "backdrop:bg-black/80 backdrop:backdrop-blur-sm"
        )}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
          <span className="text-small font-bold tracking-tight text-[#F5F5F5]">NOVA</span>
          <Button variant="ghost" size="icon" aria-label="Close menu" onClick={close} className="text-[#A0A0A5] hover:text-white hover:bg-white/10">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <nav aria-label="Mobile Navigation" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {/* 1. What We Do */}
          {whatWeDoSection && (
            <details key={whatWeDoSection.id} className="group border-b border-white/[0.08] pb-2" open>
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-body font-medium text-[#F5F5F5] transition-colors hover:bg-white/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                )}
              >
                <span>{whatWeDoSection.label}</span>
                <ChevronDown className="h-4 w-4 text-[#A0A0A5] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="flex flex-col gap-4 py-2 pl-3">
                {whatWeDoSection.groups.map((group) => (
                  <details key={group.title} className="group/sub" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-1.5 px-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#85858A] hover:text-white">
                      <span>{group.title} ({group.items.length})</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#85858A] transition-transform group-open/sub:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-0.5 pt-1 pl-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={close}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-small font-medium text-[#A0A0A5] hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
                <Link
                  href={whatWeDoSection.cta.href}
                  onClick={close}
                  className="inline-flex items-center gap-1.5 px-2.5 text-small font-semibold text-indigo-400 pt-2 hover:underline"
                >
                  <span>{whatWeDoSection.cta.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </details>
          )}

          {/* 2. Who We Are */}
          {whoWeAreSection && (
            <details key={whoWeAreSection.id} className="group border-b border-white/[0.08] pb-2">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-body font-medium text-[#F5F5F5] transition-colors hover:bg-white/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                )}
              >
                <span>{whoWeAreSection.label}</span>
                <ChevronDown className="h-4 w-4 text-[#A0A0A5] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="flex flex-col gap-4 py-2 pl-3">
                {whoWeAreSection.groups.map((group) => (
                  <details key={group.title} className="group/sub" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-1.5 px-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#85858A] hover:text-white">
                      <span>{group.title} ({group.items.length})</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#85858A] transition-transform group-open/sub:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-0.5 pt-1 pl-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={close}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-small font-medium text-[#A0A0A5] hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
                <Link
                  href={whoWeAreSection.cta.href}
                  onClick={close}
                  className="inline-flex items-center gap-1.5 px-2.5 text-small font-semibold text-indigo-400 pt-2 hover:underline"
                >
                  <span>{whoWeAreSection.cta.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </details>
          )}

          {/* 3. What We Think (Direct Link) */}
          <Link
            href="/what-we-think"
            onClick={close}
            className={cn(
              "flex items-center justify-between rounded-md px-3 py-2.5 text-body font-medium transition-colors hover:bg-white/[0.04] border-b border-white/[0.08] pb-2.5",
              pathname === "/what-we-think"
                ? "bg-white/[0.06] font-semibold text-indigo-400"
                : "text-[#F5F5F5]"
            )}
          >
            <span>What We Think</span>
            <ArrowRight className="h-4 w-4 text-[#A0A0A5]" />
          </Link>

          {/* 4. Careers */}
          {careersSection && (
            <details key={careersSection.id} className="group border-b border-white/[0.08] pb-2">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-body font-medium text-[#F5F5F5] transition-colors hover:bg-white/[0.04]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                )}
              >
                <span>{careersSection.label}</span>
                <ChevronDown className="h-4 w-4 text-[#A0A0A5] transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="flex flex-col gap-4 py-2 pl-3">
                {careersSection.groups.map((group) => (
                  <details key={group.title} className="group/sub" open>
                    <summary className="flex cursor-pointer list-none items-center justify-between py-1.5 px-2.5 rounded text-[11px] font-mono font-bold uppercase tracking-[0.25em] text-[#85858A] hover:text-white">
                      <span>{group.title} ({group.items.length})</span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#85858A] transition-transform group-open/sub:rotate-180" />
                    </summary>
                    <div className="flex flex-col gap-0.5 pt-1 pl-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={close}
                          className="flex items-center justify-between rounded-lg px-2.5 py-2 text-small font-medium text-[#A0A0A5] hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 opacity-40" />
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
                <Link
                  href={careersSection.cta.href}
                  onClick={close}
                  className="inline-flex items-center gap-1.5 px-2.5 text-small font-semibold text-indigo-400 pt-2 hover:underline"
                >
                  <span>{careersSection.cta.label}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </details>
          )}

          {/* 5. Contact */}
          <Link
            href="/contact"
            onClick={close}
            className="rounded-md px-3 py-2.5 text-body font-medium text-[#F5F5F5] hover:bg-white/[0.04] transition-colors"
          >
            Contact
          </Link>
        </nav>

        <div className="flex flex-col gap-2 border-t border-white/[0.08] p-4">
          <Link href="/login" onClick={close} className={buttonVariants({ variant: "outline", className: "w-full justify-center text-white border-white/10 hover:bg-white/10" })}>
            Login
          </Link>
          <Link href="/get-started" onClick={close} className={buttonVariants({ variant: "primary", className: "w-full justify-center bg-white text-neutral-950 hover:bg-neutral-100" })}>
            Get Started
          </Link>
        </div>
      </dialog>
    </div>
  );
}
