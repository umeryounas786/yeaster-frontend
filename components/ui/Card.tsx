import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...rest}
    />
  );
}

export function CardHeader({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border-b border-slate-200 px-5 py-4 dark:border-slate-800 ${className}`}
      {...rest}
    />
  );
}

export function CardBody({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 py-4 ${className}`} {...rest} />;
}

export function StatCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  tone?: "slate" | "emerald" | "amber" | "rose" | "indigo";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-900 dark:text-slate-100",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-semibold ${tones[tone]}`}>{value}</p>
    </Card>
  );
}
