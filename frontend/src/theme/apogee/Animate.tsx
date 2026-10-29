/**
 * frontend/src/theme/apogee/Animate.tsx
 * 
 * Entrance animation wrapper for the Apogee Design System
 * Initializes with opacity-0 and animates into view via CSS forwards.
 */

import React from "react";

export interface AnimateProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

export function Animate({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: AnimateProps) {
  const directionMap = {
    up: "animate-fade-up",
    down: "animate-fade-down",
    left: "animate-fade-left",
    right: "animate-fade-right",
    scale: "animate-fade-scale",
  };

  return (
    <div
      className={`opacity-0 ${directionMap[direction]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default Animate;

