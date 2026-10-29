/**
 * frontend/src/components/layout/Field.tsx
 * 
 * Reusable Accessible Form Field Wrapper & Input
 * - Visible label with required indicator
 * - Helper text and role="alert" error text
 * - Min 44px touch target
 * - Inset focus ring to avoid clipping
 */

import React, { useId } from "react";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      label,
      helperText,
      error,
      rightElement,
      containerClassName = "",
      className = "",
      id: customId,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const helperId = `${id}-helper`;
    const errorId = `${id}-error`;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-white/70"
          >
            {label}
            {required && <span className="text-rose-400 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <input
            id={id}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-black/60 border text-white text-sm placeholder:text-white/30 transition-all font-mono outline-none ${
              error
                ? "border-rose-500/50 focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                : "border-white/20 focus:border-white focus:ring-1 focus:ring-white"
            } ${disabled ? "opacity-40 cursor-not-allowed bg-white/5" : ""} ${
              rightElement ? "pr-12" : ""
            } ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2.5 flex items-center">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <p id={errorId} role="alert" className="text-xs text-rose-400 pt-0.5">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-[11px] text-white/50 pt-0.5 leading-normal">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Field.displayName = "Field";

export default Field;
