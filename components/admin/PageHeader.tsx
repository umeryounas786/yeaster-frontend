import Link from "next/link";

interface Crumb {
  href?: string;
  label: string;
}

interface Props {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  description,
  breadcrumbs,
  eyebrow,
  actions,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs">
            {breadcrumbs.map((c, i) => {
              const isLast = i === breadcrumbs.length - 1;
              return (
                <div key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                  {c.href && !isLast ? (
                    <Link
                      href={c.href}
                      className="text-slate-400 transition hover:text-slate-700"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "font-semibold text-[#0B0D12]"
                          : "text-slate-400"
                      }
                    >
                      {c.label}
                    </span>
                  )}
                  {!isLast && <span className="text-slate-300">/</span>}
                </div>
              );
            })}
          </nav>
        )}
        {eyebrow}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0B0D12]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
