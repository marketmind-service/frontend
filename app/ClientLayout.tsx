"use client";

import { ThemeProvider } from "next-themes";
import { ParticlesBackground } from "@/app/components/ParticlesBackground";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      {/* Global particle background */}
      <ParticlesBackground />
      {children}
    </ThemeProvider>
  );
}
