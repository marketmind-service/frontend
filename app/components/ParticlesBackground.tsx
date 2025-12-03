"use client";

import React from "react";
import { Particles } from "@/registry/magicui/particles";

export function ParticlesBackground() {
  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10"
      quantity={100}
      ease={80}
      color="#ffffff" // white particles for your dark background
      refresh
    />
  );
}
