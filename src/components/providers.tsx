"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/primitives";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "!rounded-xl !border-border !bg-card !text-foreground !shadow-xl",
              description: "!text-muted-foreground",
            },
          }}
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
