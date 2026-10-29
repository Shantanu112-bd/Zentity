/**
 * frontend/src/theme/components/CutIconButton.tsx
 * 
 * Small octagonal cut-corner icon button component (8px cut)
 * Compliant with ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2 & spec:
 * - .btn-cut-sm: 8px cut-corner button
 * - Inset focus-visible outlines that survive clipping
 * - Typically 40x40px for external/social/action icons
 */

import React from "react";
import { Link } from "react-router-dom";

export interface CutIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  title?: string;
  variant?: "solid" | "outline";
}

export const CutIconButton: React.FC<CutIconButtonProps> = ({
  to,
  href,
  external = true,
  children,
  title,
  variant = "solid",
  className = "",
  style,
  disabled,
  ...props
}) => {
  const baseClass = variant === "outline" ? "btn-cut-sm bg-transparent border border-white/20 text-white" : "btn-cut-sm bg-white text-black";
  const sizeClass = "w-10 h-10 inline-flex items-center justify-center transition-colors hover:bg-white/90";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  const combinedClassName = `${baseClass} ${sizeClass} ${disabledClass} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClassName} title={title} style={style}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={combinedClassName}
        title={title}
        style={style}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={combinedClassName} title={title} style={style} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

