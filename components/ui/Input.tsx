"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, className = "", id, ...rest },
  ref
) {
  const inputId = id || rest.name;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 ${
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : ""
        } ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
