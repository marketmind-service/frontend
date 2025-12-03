// app/components/ParticlesBackground.tsx
"use client";

import React from "react";
import { Particles } from "@/app/registry/magicui/particles";

export function ParticlesBackground() {
  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10 opacity-40"
      quantity={50}
      color="#ffffff"
    />
  );
}
