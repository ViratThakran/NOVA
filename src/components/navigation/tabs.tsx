"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Manual WAI-ARIA tabs pattern (roving tabindex + arrow-key navigation) —
// no headless UI dependency for this foundation phase.
export interface TabItem {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const focusAndSelect = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    tabRefs.current.get(item.value)?.focus();
    onValueChange(item.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusAndSelect((index + 1) % items.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusAndSelect((index - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        focusAndSelect(0);
        break;
      case "End":
        event.preventDefault();
        focusAndSelect(items.length - 1);
        break;
    }
  };

  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-md border border-border bg-surface p-1", className)}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              if (el) tabRefs.current.set(item.value, el);
            }}
            role="tab"
            type="button"
            id={`tab-${item.value}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-small font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "disabled:pointer-events-none disabled:opacity-50",
              selected ? "bg-surface-elevated text-text" : "text-text-muted hover:text-text"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  activeValue: string;
}

export function TabPanel({ value, activeValue, className, children, ...props }: TabPanelProps) {
  if (value !== activeValue) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      tabIndex={0}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
