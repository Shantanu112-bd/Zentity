/**
 * frontend/src/components/layout/PageHeader.tsx
 * 
 * Standardized Page Header for Pramaan-ZK App Routes
 * - Eyebrow: text-white/50 text-xs tracking-[0.2em]
 * - Title: text-3xl md:text-5xl font-normal tracking-[-0.04em] text-white
 * - Description: text-white/70 text-sm max-w-xl leading-relaxed
 * - Right slot: status chips, network badges, or actions
 */

import React from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string | React.ReactNode;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  rightSlot,
  className = "",
}) => {
  return (
    <div className={`mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/10 ${className}`}>
      <div className="space-y-2">
        {eyebrow && (
          <div className="text-white/50 text-xs tracking-[0.2em] uppercase font-mono font-medium">
            {eyebrow}
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.04em] text-white leading-tight">
          {title}
        </h1>
        {description && (
          <div className="text-white/70 text-sm max-w-xl leading-relaxed pt-1">
            {description}
          </div>
        )}
      </div>

      {rightSlot && (
        <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-end">
          {rightSlot}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
