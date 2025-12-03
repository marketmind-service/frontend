"use client";

import React from "react";
import { ParticlesBackground } from "@/app/components/ParticlesBackground";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Global particle background behind everything */}
      <ParticlesBackground />
      {children}
    </>
  );
}
