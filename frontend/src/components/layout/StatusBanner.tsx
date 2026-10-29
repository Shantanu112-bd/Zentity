/**
 * frontend/src/components/layout/StatusBanner.tsx
 * 
 * Reusable Status Banner Primitive
 * - Variants: info, warning, error, success
 * - Clear non-technical headline + expandable technical details
 * - Accessible roles and aria attributes
 */

import React, { useState } from "react";
import {
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type StatusBannerVariant = "info" | "warning" | "error" | "success";

export interface StatusBannerProps {
  variant: StatusBannerVariant;
  title: string;
  description?: React.ReactNode;
  details?: string | object;
  action?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  StatusBannerVariant,
  {
    container: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    titleClass: string;
    badgeBg: string;
  }
> = {
  info: {
    container: "bg-sky-500/10 border-sky-500/30 text-sky-200",
    icon: Info,
    iconClass: "text-sky-400",
    titleClass: "text-sky-100",
    badgeBg: "bg-sky-500/20 text-sky-300",
  },
  warning: {
    container: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    icon: AlertTriangle,
    iconClass: "text-amber-400",
    titleClass: "text-amber-100",
    badgeBg: "bg-amber-500/20 text-amber-300",
  },
  error: {
    container: "bg-rose-500/10 border-rose-500/30 text-rose-200",
    icon: AlertCircle,
    iconClass: "text-rose-400",
    titleClass: "text-rose-100",
    badgeBg: "bg-rose-500/20 text-rose-300",
  },
  success: {
    container: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
    titleClass: "text-emerald-100",
    badgeBg: "bg-emerald-500/20 text-emerald-300",
  },
};

export const StatusBanner: React.FC<StatusBannerProps> = ({
  variant,
  title,
  description,
  details,
  action,
  className = "",
}) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const cfg = variantStyles[variant];
  const IconComponent = cfg.icon;

  const formattedDetails =
    typeof details === "string" ? details : JSON.stringify(details, null, 2);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`border rounded-xl p-4 transition-all ${cfg.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.iconClass}`} />

        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className={`text-sm font-medium ${cfg.titleClass}`}>{title}</h4>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>

          {description && (
            <div className="text-xs text-white/80 leading-relaxed">
              {description}
            </div>
          )}

          {details && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className="inline-flex items-center gap-1 text-[11px] font-mono underline hover:text-white transition-colors"
                aria-expanded={detailsExpanded}
              >
                {detailsExpanded ? (
                  <>
                    <span>Hide Technical Details</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show Technical Details</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>

              {detailsExpanded && (
                <pre className="mt-2 p-3 rounded-lg bg-black/60 border border-white/10 font-mono text-[11px] text-white/70 overflow-x-auto max-h-48 leading-normal">
                  <code>{formattedDetails}</code>
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBanner;
