/**
 * frontend/src/components/layout/Card.tsx
 * 
 * Reusable Card Primitive for App Pages
 * - Glassmorphic surface: bg-white/[0.07] backdrop-blur-xl border border-white/20 rounded-2xl
 * - Header with title, optional subtitle, and header action/chip slot
 * - Optional divider between header and body
 * - Optional footer with right-aligned action buttons
 */

import React from "react";

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  divider?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  divider = false,
  children,
  footer,
  className = "",
  bodyClassName = "",
}) => {
  const hasHeader = Boolean(title || subtitle || headerAction);

  return (
    <div
      className={`bg-white/[0.07] backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-6 shadow-xl transition-all relative ${className}`}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-1">
            {typeof title === "string" ? (
              <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-white/60 leading-relaxed">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}

      {hasHeader && divider && <div className="border-b border-white/10 my-4" />}

      <div className={`text-white/90 text-sm ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-end gap-3 flex-wrap">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
