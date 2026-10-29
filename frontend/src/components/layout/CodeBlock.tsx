/**
 * frontend/src/components/layout/CodeBlock.tsx
 * 
 * Reusable Code & JSON Viewer
 * - Bordered, max-h-64, scrollable with custom styling
 * - Monospace typography with crisp contrast
 * - Copy button with tooltip feedback
 * - Optional title/filename header
 */

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

export interface CodeBlockProps {
  code: string | object;
  title?: string;
  maxHeight?: string;
  className?: string;
  copyable?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  title,
  maxHeight = "max-h-64",
  className = "",
  copyable = true,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedCode =
    typeof code === "string" ? code : JSON.stringify(code, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={`border border-white/15 bg-black/70 rounded-xl overflow-hidden font-mono text-xs ${className}`}
    >
      {(title || copyable) && (
        <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/10 bg-white/[0.04] text-white/60">
          <span className="text-[11px] font-mono tracking-wider truncate">
            {title || "Output"}
          </span>
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] text-white/50 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      <pre
        className={`p-4 overflow-x-auto overflow-y-auto ${maxHeight} text-white/85 leading-relaxed selection:bg-white/20`}
      >
        <code>{formattedCode}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
