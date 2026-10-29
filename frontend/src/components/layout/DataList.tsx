/**
 * frontend/src/components/layout/DataList.tsx
 * 
 * Reusable Key-Value Data Display List
 * - Supports middle-truncation for addresses and transaction hashes
 * - Full value preserved in `title` attribute for tooltip readability
 * - One-click clipboard copy with feedback
 * - Clean responsive layout (stacked on small mobile, row on larger screens)
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export interface DataListItem {
  label: string;
  value: React.ReactNode;
  rawValue?: string;
  isMono?: boolean;
  truncateMiddle?: boolean;
  copyable?: boolean;
  helpText?: string;
}

export interface DataListProps {
  items: DataListItem[];
  className?: string;
  density?: "comfortable" | "compact";
}

function truncateStringMiddle(str: string, lead = 10, tail = 8): string {
  if (!str || str.length <= lead + tail) return str;
  return `${str.slice(0, lead)}...${str.slice(-tail)}`;
}

export const DataList: React.FC<DataListProps> = ({
  items,
  className = "",
  density = "comfortable",
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (key: string, textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
      setCopiedKey(null);
    }
  };

  const pyClass = density === "compact" ? "py-2" : "py-3";

  return (
    <dl className={`divide-y divide-white/10 ${className}`}>
      {items.map((item, index) => {
        const itemKey = `${item.label}-${index}`;
        const copyText =
          item.rawValue ?? (typeof item.value === "string" ? item.value : "");
        const isCopied = copiedKey === itemKey;

        let displayValue = item.value;
        if (
          item.truncateMiddle &&
          typeof item.value === "string" &&
          item.value.length > 20
        ) {
          displayValue = truncateStringMiddle(item.value);
        }

        return (
          <div
            key={itemKey}
            className={`${pyClass} flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm`}
          >
            <dt className="text-white/60 font-medium sm:w-1/3 flex-shrink-0">
              {item.label}
              {item.helpText && (
                <span className="block text-[11px] text-white/40 font-normal">
                  {item.helpText}
                </span>
              )}
            </dt>

            <dd className="sm:w-2/3 flex items-center justify-between sm:justify-end gap-2 text-white overflow-hidden">
              <span
                className={`truncate ${item.isMono ? "font-mono" : ""}`}
                title={copyText || undefined}
              >
                {displayValue}
              </span>

              {item.copyable && copyText && (
                <button
                  type="button"
                  onClick={() => handleCopy(itemKey, copyText)}
                  className="p-1 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
                  title="Copy to clipboard"
                  aria-label={`Copy ${item.label}`}
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
};

export default DataList;
