"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Particles } from "@/registry/magicui/particles";

export function ParticlesBackground() {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ffffff");

  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

  return (
    <Particles
      className="pointer-events-none fixed inset-0 -z-10"
      quantity={100}
      ease={80}
      color={color}
      refresh
    />
  );
}
