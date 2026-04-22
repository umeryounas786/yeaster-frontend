"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Check,
  Pause,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import { usersApi, ApiError } from "@/lib/api";
import type { UserStats } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await usersApi.stats();
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof ApiError ? e.message : "Failed to load stats");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Snapshot of all tenants connected to their CompuVOIP PBX."
        breadcrumbs={[{ label: "Admin" }, { label: "Overview" }]}
        actions={
          <Link href="/admin/users/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="TOTAL USERS"
          value={stats?.total ?? 0}
          loading={loading}
          icon={UsersIcon}
          iconBg="bg-[#EEF2FF]"
          iconFg="text-[#0062FF]"
          variant="light"
        />
        <StatCard
          label="ACTIVE"
          value={stats?.active ?? 0}
          loading={loading}
          icon={Check}
          iconBg="bg-[#10B981]"
          iconFg="text-white"
          variant="tinted"
        />
        <StatCard
          label="INACTIVE"
          value={stats?.inactive ?? 0}
          loading={loading}
          icon={Pause}
          iconBg="bg-[#FEF3C7]"
          iconFg="text-[#D97706]"
          variant="light"
        />
        <StatCard
          label="SUSPENDED"
          value={stats?.suspended ?? 0}
          loading={loading}
          icon={Ban}
          iconBg="bg-[#DC2626]"
          iconFg="text-white"
          variant="dark"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickLink
          href="/admin/users"
          title="Manage users"
          description="View, edit, suspend, or delete users."
        />
        <QuickLink
          href="/admin/users/new"
          title="Create new user"
          description="Add credentials and PBX config for a new tenant."
        />
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconFg: string;
  variant: "light" | "tinted" | "dark";
}

function StatCard({
  label,
  value,
  loading,
  icon: Icon,
  iconBg,
  iconFg,
  variant,
}: StatProps) {
  const card =
    variant === "dark"
      ? "bg-[#0B0D12]"
      : variant === "tinted"
        ? "bg-[#F0FDF4]"
        : "bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]";
  const labelCls =
    variant === "dark"
      ? "text-rose-300"
      : variant === "tinted"
        ? "text-[#047857]"
        : "text-slate-500";
  const valueCls =
    variant === "dark"
      ? "text-white"
      : variant === "tinted"
        ? "text-[#064E3B]"
        : "text-[#0B0D12]";

  return (
    <div className={`rounded-2xl p-5 ${card}`}>
      <div className="flex items-center justify-between">
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.1em] ${labelCls}`}
        >
          {label}
        </p>
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${iconFg}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-14" />
      ) : (
        <p
          className={`mt-3 font-mono-data text-[36px] font-bold leading-none ${valueCls}`}
        >
          {String(value).padStart(2, "0")}
        </p>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] transition hover:shadow-md"
    >
      <div>
        <p className="font-heading text-[15px] font-bold text-[#0B0D12]">
          {title}
        </p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-[#0062FF] group-hover:text-white">
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
