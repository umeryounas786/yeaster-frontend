"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Pause,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { usersApi, ApiError } from "@/lib/api";
import type { UserProfile, UserStats, UserStatus } from "@/lib/types";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/admin/PageHeader";

// Palette of deterministic avatar colors (so same user keeps same color).
const AVATAR_COLORS = [
  "#0062FF",
  "#7C3AED",
  "#F59E0B",
  "#DC2626",
  "#10B981",
  "#0EA5E9",
  "#EC4899",
  "#64748B",
];
function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const STATUS_STYLES: Record<
  UserStatus,
  { bg: string; dot: string; text: string; label: string }
> = {
  active: {
    bg: "bg-[#D1FAE5]",
    dot: "bg-[#059669]",
    text: "text-[#047857]",
    label: "Active",
  },
  inactive: {
    bg: "bg-[#FEF3C7]",
    dot: "bg-[#D97706]",
    text: "text-[#92400E]",
    label: "Inactive",
  },
  suspended: {
    bg: "bg-[#FEE2E2]",
    dot: "bg-[#DC2626]",
    text: "text-[#991B1B]",
    label: "Suspended",
  },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await usersApi.stats();
      setStats(data);
    } catch {
      // non-fatal
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.items);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const handle = setTimeout(load, 200);
    return () => clearTimeout(handle);
  }, [load]);

  async function onConfirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await usersApi.remove(toDelete._id);
      toast.success("User deleted", `@${toDelete.username} removed`);
      setToDelete(null);
      await Promise.all([load(), loadStats()]);
    } catch (e) {
      toast.error(
        "Delete failed",
        e instanceof ApiError ? e.message : "Please try again"
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage tenants connecting to their CompuVOIP PBX."
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
        actions={
          <>
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Link href="/admin/users/new">
              <Button>
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </Link>
          </>
        }
      />

      {/* Stat cards — suspended is the "hero dark" card per design */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardLight
          label="TOTAL USERS"
          value={stats?.total ?? 0}
          loading={!stats}
          icon={<UsersIcon className="h-3.5 w-3.5 text-[#0062FF]" />}
          iconBg="bg-[#EEF2FF]"
          delta={
            <>
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span className="font-semibold text-emerald-600">New this week</span>
            </>
          }
        />
        <StatCardTinted
          label="ACTIVE"
          value={stats?.active ?? 0}
          loading={!stats}
          icon={<Check className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-[#10B981]"
          tintBg="bg-[#F0FDF4]"
          labelColor="text-[#047857]"
          valueColor="text-[#064E3B]"
          subtext={
            stats
              ? `${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total`
              : ""
          }
          subtextColor="text-[#047857]"
        />
        <StatCardLight
          label="INACTIVE"
          value={stats?.inactive ?? 0}
          loading={!stats}
          icon={<Pause className="h-3.5 w-3.5 text-[#D97706]" />}
          iconBg="bg-[#FEF3C7]"
          delta={<span className="text-slate-500">Paused access</span>}
        />
        <StatCardDark
          label="SUSPENDED"
          value={stats?.suspended ?? 0}
          loading={!stats}
          icon={<Ban className="h-3.5 w-3.5 text-white" />}
          iconBg="bg-[#DC2626]"
          subtext="Policy violation"
        />
      </div>

      {/* Table panel */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {/* Panel header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-[15px] font-bold text-[#0B0D12]">
              All users
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-slate-600">
              {total}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="h-9 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent transition focus:bg-white focus:outline-none focus:ring-slate-200"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value as UserStatus | "");
                }}
                className="h-9 appearance-none rounded-xl bg-slate-50 pl-3 pr-8 text-xs font-semibold text-[#0B0D12] ring-1 ring-inset ring-transparent focus:outline-none focus:ring-slate-200"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="border-y border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description={
              search || statusFilter
                ? "Try adjusting your filters."
                : "Create your first user to get started."
            }
            action={
              <Link href="/admin/users/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  Add User
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr
                  className="bg-[#F9FAFB] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500"
                >
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3 w-[220px]">PBX Connection</th>
                  <th className="px-5 py-3 w-[110px]">Status</th>
                  <th className="px-5 py-3 w-[110px]">Created</th>
                  <th className="px-5 py-3 w-[100px]" />
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const status = STATUS_STYLES[u.status];
                  const color = avatarColor(u.username);
                  return (
                    <tr
                      key={u._id}
                      className={`transition hover:bg-slate-50/80 ${idx % 2 === 1 ? "bg-[#FBFBFC]" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#0B0D12]">
                              {u.fullName || u.username}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">
                              @{u.username} · {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        {u.pbx?.host ? (
                          <div>
                            <p className="font-mono-data text-xs font-semibold text-[#0B0D12]">
                              {u.pbx.host}:{u.pbx.port}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {u.pbx.useHttps ? "HTTPS" : "HTTP"}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-mono-data text-xs text-slate-400">—</p>
                            <p className="text-[10px] text-slate-400">
                              Not configured
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 align-middle text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            aria-label={`Edit ${u.username}`}
                            onClick={() =>
                              router.push(`/admin/users/${u._id}/edit`)
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-[#0B0D12]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${u.username}`}
                            onClick={() => setToDelete(u)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-5 py-3 text-xs">
            <p className="text-slate-500">
              Page <span className="font-mono-data font-semibold text-[#0B0D12]">{page}</span> of{" "}
              <span className="font-mono-data font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        title="Delete user?"
        description={
          toDelete
            ? `This will permanently delete @${toDelete.username}. This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={onConfirmDelete}
        onClose={() => (deleting ? null : setToDelete(null))}
      />
    </div>
  );
}

// ─── Stat card variants ───

function StatCardLight({
  label,
  value,
  loading,
  icon,
  iconBg,
  delta,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-14" />
      ) : (
        <p className="mt-3 font-mono-data text-[36px] font-bold leading-none text-[#0B0D12]">
          {String(value).padStart(2, "0")}
        </p>
      )}
      {delta && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
          {delta}
        </div>
      )}
    </div>
  );
}

function StatCardTinted({
  label,
  value,
  loading,
  icon,
  iconBg,
  tintBg,
  labelColor,
  valueColor,
  subtext,
  subtextColor,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  tintBg: string;
  labelColor: string;
  valueColor: string;
  subtext: string;
  subtextColor: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${tintBg}`}>
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-bold uppercase tracking-[0.1em] ${labelColor}`}>
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-14" />
      ) : (
        <p className={`mt-3 font-mono-data text-[36px] font-bold leading-none ${valueColor}`}>
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className={`mt-2.5 text-[11px] ${subtextColor}`}>{subtext}</p>
    </div>
  );
}

function StatCardDark({
  label,
  value,
  loading,
  icon,
  iconBg,
  subtext,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl bg-[#0B0D12] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-300">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-14" />
      ) : (
        <p className="mt-3 font-mono-data text-[36px] font-bold leading-none text-white">
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className="mt-2.5 text-[11px] text-slate-400">{subtext}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-56" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
