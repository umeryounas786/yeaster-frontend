import type { HTMLAttributes } from "react";

type Tone = "slate" | "emerald" | "amber" | "rose" | "indigo" | "sky";

interface Props extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

const toneClasses: Record<Tone, string> = {
  slate:
    "bg-slate-200 text-slate-900 ring-slate-300 dark:bg-slate-700/70 dark:text-slate-100 dark:ring-slate-500/60",
  emerald:
    "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-600/25 dark:text-emerald-100 dark:ring-emerald-500/50",
  amber:
    "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-600/25 dark:text-amber-100 dark:ring-amber-500/50",
  rose:
    "bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-600/25 dark:text-rose-100 dark:ring-rose-500/50",
  indigo:
    "bg-indigo-100 text-indigo-900 ring-indigo-300 dark:bg-indigo-600/25 dark:text-indigo-100 dark:ring-indigo-500/50",
  sky:
    "bg-sky-100 text-sky-900 ring-sky-300 dark:bg-sky-600/25 dark:text-sky-100 dark:ring-sky-500/50",
};

const dotClasses: Record<Tone, string> = {
  slate: "bg-slate-600 dark:bg-slate-300",
  emerald: "bg-emerald-600 dark:bg-emerald-400",
  amber: "bg-amber-600 dark:bg-amber-400",
  rose: "bg-rose-600 dark:bg-rose-400",
  indigo: "bg-indigo-600 dark:bg-indigo-400",
  sky: "bg-sky-600 dark:bg-sky-400",
};

export default function Badge({
  tone = "slate",
  dot = false,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />}
      {children}
    </span>
  );
}
