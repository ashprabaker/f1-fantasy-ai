"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark
      }}
      afterSignOutUrl="/home"
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
} 