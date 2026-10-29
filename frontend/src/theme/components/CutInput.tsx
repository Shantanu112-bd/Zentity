/**
 * frontend/src/theme/components/CutInput.tsx
 * 
 * Form input / select components aligned with the Pramaan-ZK design system.
 */

import React from "react";

export interface CutInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const CutInput: React.FC<CutInputProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-white/70 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-3 bg-white/[0.05] border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white focus:bg-white/[0.08] transition-colors rounded-lg ${
          error ? "border-rose-500/50" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-rose-400">{error}</span>}
      {helperText && !error && <span className="text-xs text-white/50">{helperText}</span>}
    </div>
  );
};

