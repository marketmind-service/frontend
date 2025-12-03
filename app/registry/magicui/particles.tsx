"use client";

import React, { useMemo } from "react";

type ParticlesProps = {
  className?: string;
  quantity?: number;
  ease?: number;
  color?: string;
  refresh?: boolean;
};

export function Particles({
  className,
  quantity = 80,
  color = "#ffffff",
  refresh,
}: ParticlesProps) {
  const particles = useMemo(() => {
    return Array.from({ length: quantity }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.4,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -20,
    }));
  }, [quantity, refresh]);

  const combinedClassName = [
    "pointer-events-none absolute inset-0 overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={combinedClassName}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="mm-particle"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: color,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      <style jsx global>{`
        .mm-particle {
          position: absolute;
          border-radius: 9999px;
          animation-name: mm-float-particles;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-direction: alternate;
        }

        @keyframes mm-float-particles {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(20px, -40px, 0) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
