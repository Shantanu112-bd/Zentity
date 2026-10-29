/**
 * frontend/src/theme/components/CutButton.tsx
 * 
 * Octagonal cut-corner button component (12px cut)
 * Compliant with ANTIGRAVITY_UI_REDESIGN_PROMPT.md §2 & spec:
 * - .btn-cut: solid white button with black text
 * - .btn-cut-border: outline button with 1px border and black interior
 * - Inset focus-visible outlines that survive polygon clipping
 * - Works as <button>, <a>, or react-router <Link>
 */

import React from "react";
import { Link } from "react-router-dom";

export interface CutButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
  size?: "md" | "lg" | "sm";
  to?: string;
  href?: string;
  external?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  children: React.ReactNode;
}

export const CutButton: React.FC<CutButtonProps> = ({
  variant = "solid",
  size = "md",
  to,
  href,
  external,
  icon,
  iconPosition = "right",
  children,
  className = "",
  style,
  disabled,
  ...props
}) => {
  const baseClass = variant === "outline" ? "btn-cut-border" : "btn-cut";

  let sizeClass = "px-6 py-3 text-sm";
  if (size === "lg") sizeClass = "px-8 py-3.5 text-base";
  if (size === "sm") sizeClass = "px-4 py-2 text-xs";

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";
  const combinedClassName = `${baseClass} ${sizeClass} ${disabledClass} ${className}`;

  const content = (
    <>
      {icon && iconPosition === "left" && <span className="inline-flex mr-2">{icon}</span>}
      <span className="relative z-10 font-medium tracking-tight">{children}</span>
      {icon && iconPosition === "right" && <span className="inline-flex ml-2">{icon}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={combinedClassName} style={style}>
        {content}
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
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <button className={combinedClassName} style={style} disabled={disabled} {...props}>
      {content}
    </button>
  );
};

