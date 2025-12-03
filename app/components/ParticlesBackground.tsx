"use client";

import React from "react";
// 👇 NOTE: now points to app/registry/...
import { Particles } from "@/app/registry/magicui/particles";

export function ParticlesBackground() {
  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10"
      quantity={100}
      ease={80}
      color="#ffffff"
      refresh
    />
  );
}
