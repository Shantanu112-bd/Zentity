/**
 * frontend/src/theme/components/Glass.tsx
 * 
 * Reusable Glassmorphism Panel
 * Compliant with ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2 & §3:
 * - bg-white/10 backdrop-blur border border-white/20 rounded-2xl
 * - High contrast against dark background
 */

import React from "react";

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "subtle" | "prominent";
  noPadding?: boolean;
}

export const Glass: React.FC<GlassProps> = ({
  children,
  variant = "default",
  noPadding = false,
  className = "",
  style,
  ...props
}) => {
  let bgClass = "bg-white/[0.07] border-white/[0.15]";
  if (variant === "subtle") bgClass = "bg-white/[0.04] border-white/[0.08]";
  if (variant === "prominent") bgClass = "bg-white/[0.12] border-white/[0.25]";

  const paddingClass = noPadding ? "" : "p-6 sm:p-8";

  return (
    <div
      className={`relative rounded-2xl border backdrop-blur-xl ${bgClass} ${paddingClass} ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

