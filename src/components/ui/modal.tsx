"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Built on the native <dialog> element: focus trapping, Escape-to-close,
// return-focus-to-trigger, and top-layer rendering all come for free from
// the browser instead of hand-rolled focus-trap logic.
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

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
      // Fired on Escape — prevent the native close so state stays in sync,
      // then let the caller decide (mirrors onClose for a click-driven close).
      event.preventDefault();
      onClose();
    };
    const handleClose = () => onClose();

    dialog.addEventListener("cancel", handleCancel);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClick={handleBackdropClick}
      className={cn(
        "m-auto w-full max-w-md rounded-modal border border-border bg-surface-elevated p-0 text-text shadow-2xl",
        "backdrop:bg-background/80 backdrop:backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <h2 id={titleId} className="text-h3 font-semibold text-text">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="mt-1 text-small text-text-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className={cn(
            "shrink-0 rounded-sm p-1 text-text-muted transition-colors hover:bg-surface hover:text-text",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
