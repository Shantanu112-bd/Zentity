/**
 * frontend/src/components/layout/EmptyState.tsx
 * 
 * Reusable Empty State Component
 * - Centered layout with muted icon container
 * - Title and description
 * - Action button slot
 */

import React from "react";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconComponent = FolderOpen,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-white/15 rounded-2xl bg-white/[0.02] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 mb-4">
        <IconComponent className="w-6 h-6" />
      </div>

      <h3 className="text-base font-medium text-white mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-white/60 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
