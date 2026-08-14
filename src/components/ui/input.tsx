"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const inputBase =
  "w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25 outline-none disabled:cursor-not-allowed disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input ref={ref} type={type} className={cn(inputBase, "h-11", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputBase, "min-h-28 py-3 leading-relaxed resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Flex + gap statt space-y: der Abstand hängt so nicht davon ab, wie viele
    // Kinder das Feld rendert. `Select` liefert z. B. zusätzlich ein verstecktes
    // Input und Radix ein Spiegel-<select> — mit space-y ergab das eine zweite
    // Lücke und das Feld war 6 px höher als die Bedienelemente daneben.
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-primary">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
