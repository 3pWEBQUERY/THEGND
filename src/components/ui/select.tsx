"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Eigenes Auswahlfeld — die Liste wird von der App gezeichnet, nicht vom
 * Browser oder Betriebssystem. Damit sieht es auf macOS, Windows, Android und
 * iOS identisch aus und folgt den Design-Tokens (Radius, Farben, Dark Mode).
 *
 * Die API ist bewusst an `<select>` angelehnt: Optionen werden als `<option>`
 * übergeben, `name`/`defaultValue`/`value`/`onChange` funktionieren wie gewohnt.
 * Der Wert landet über ein verstecktes Feld im FormData, deshalb funktionieren
 * Server Actions unverändert.
 *
 * Leere Werte (`<option value="">`) sind erlaubt, obwohl Radix sie intern
 * verbietet — sie werden auf einen Platzhalter-Schlüssel abgebildet und beim
 * Absenden wieder zu "".
 */

const EMPTY = "__leer__";

type OptionData = { value: string; label: string; disabled?: boolean };

/** Sammelt `<option>`-Kinder ein, auch wenn sie in Fragmenten oder Arrays stecken. */
function collectOptions(children: React.ReactNode, out: OptionData[] = []): OptionData[] {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      collectOptions((child.props as { children?: React.ReactNode }).children, out);
      return;
    }

    if (child.type === "option") {
      const props = child.props as { value?: string | number; children?: React.ReactNode; disabled?: boolean };
      out.push({
        value: String(props.value ?? ""),
        label: React.Children.toArray(props.children).join(""),
        disabled: props.disabled,
      });
      return;
    }

    if (child.type === "optgroup") {
      collectOptions((child.props as { children?: React.ReactNode }).children, out);
    }
  });
  return out;
}

export interface SelectProps {
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (event: { target: { name?: string; value: string } }) => void;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  "aria-label"?: string;
  id?: string;
  children?: React.ReactNode;
}

export function Select({
  name,
  value,
  defaultValue,
  onChange,
  onValueChange,
  required,
  disabled,
  placeholder,
  className,
  contentClassName,
  children,
  id,
  ...rest
}: SelectProps) {
  const options = React.useMemo(() => collectOptions(children), [children]);

  // Eine deaktivierte Option ohne Wert ist in Wahrheit ein Platzhalter.
  const placeholderOption = options.find((o) => o.disabled && o.value === "");
  const items = options.filter((o) => o !== placeholderOption);
  const hint = placeholder ?? placeholderOption?.label ?? "Bitte wählen";

  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState(String(defaultValue ?? ""));
  const current = controlled ? String(value) : internal;

  // Ein von aussen geändertes `defaultValue` (z. B. nach dem Speichern) übernehmen.
  const seed = React.useRef(defaultValue);
  React.useEffect(() => {
    if (controlled || seed.current === defaultValue) return;
    seed.current = defaultValue;
    setInternal(String(defaultValue ?? ""));
  }, [defaultValue, controlled]);

  const selectedLabel = options.find((o) => o.value === current && o !== placeholderOption)?.label ?? "";

  const handleChange = (next: string) => {
    const real = next === EMPTY ? "" : next;
    if (!controlled) setInternal(real);
    onValueChange?.(real);
    onChange?.({ target: { name, value: real } });
  };

  return (
    <>
      {name && <input type="hidden" name={name} value={current} />}
      <SelectPrimitive.Root
        value={current === "" ? EMPTY : current}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={id}
          aria-required={required || undefined}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 text-left text-sm text-foreground shadow-xs transition-colors outline-none",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25",
            "data-[state=open]:border-ring disabled:cursor-not-allowed disabled:opacity-60",
            "data-[placeholder]:text-muted-foreground/70",
            className,
          )}
          {...rest}
        >
          {/* Eigene Beschriftung statt Select.Value: Radix kennt das Label erst,
              wenn die Liste einmal geöffnet war — der Trigger bliebe sonst leer. */}
          <span className={cn("truncate", selectedLabel ? "" : "text-muted-foreground/70")}>
            {selectedLabel || hint}
          </span>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className={cn(
              "z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-card text-sm shadow-xl",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0",
              contentClassName,
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center bg-card text-muted-foreground">
              <ChevronUp className="size-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1.5">
              {placeholderOption && (
                <SelectItem value={EMPTY} className="text-muted-foreground">
                  {placeholderOption.label}
                </SelectItem>
              )}
              {items.map((option) => (
                <SelectItem
                  key={option.value || EMPTY}
                  value={option.value === "" ? EMPTY : option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center bg-card text-muted-foreground">
              <ChevronDown className="size-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-3 pr-8 outline-none transition-colors",
        "focus:bg-muted data-[state=checked]:font-medium data-[state=checked]:text-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
