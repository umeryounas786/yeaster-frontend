"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  History as HistoryIcon,
  Search as SearchIcon,
  Trash2,
} from "lucide-react";
import { ApiError, voicemailApi } from "@/lib/api";
import type { Voicemail } from "@/lib/types";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/admin/PageHeader";

type RangeDays = 30 | 60 | 90;
const PAGE_SIZE = 50;

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
  for (let i = 0; i < seed.length; i++)
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function statusBadge(v: Voicemail) {
  if (v.removedAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
        <Trash2 className="h-3 w-3" />
        Deleted
      </span>
    );
  }
  if (v.savedByUser) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
        Saved
      </span>
    );
  }
  if (!v.isRead) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        New
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
      Read
    </span>
  );
}

export default function HistoryPage() {
  const [days, setDays] = useState<RangeDays>(30);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Voicemail[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await voicemailApi.history({
        days,
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [days, page, search]);

  useEffect(() => {
    const handle = setTimeout(load, 200);
    return () => clearTimeout(handle);
  }, [load]);

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <PageHeader
        title="History"
        description={`Audit trail of voicemails over the last ${days} days, including deleted ones.`}
        eyebrow={
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Audit
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search caller, number, extension…"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="h-10 w-[260px] rounded-xl bg-white pl-9 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent focus:ring-slate-200"
              />
            </div>
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-inset ring-slate-200">
              {([30, 60, 90] as RangeDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setDays(d);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    days === d
                      ? "bg-[#0B0D12] text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-[15px] font-bold text-[#0B0D12]">
              All records
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-slate-600">
              {total}
            </span>
          </div>
          {total > 0 && (
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {rangeStart}-{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {total}
              </span>
            </p>
          )}
        </div>

        {error && (
          <div className="border-y border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <HistorySkeleton />
        ) : items.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="No records"
            description={
              search
                ? "No matches for your search in this period."
                : `No voicemail activity in the last ${days} days.`
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#F9FAFB] text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  <th className="px-5 py-3">Caller</th>
                  <th className="px-5 py-3 w-[180px]">Extension</th>
                  <th className="px-5 py-3 w-[150px]">Received</th>
                  <th className="px-5 py-3 w-[100px]">Duration</th>
                  <th className="px-5 py-3 w-[120px]">Status</th>
                  <th className="px-5 py-3 w-[150px]">Removed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((v) => {
                  const caller = v.callerName || v.callerNumber || "Unknown";
                  const color = avatarColor(caller);
                  const initials = caller
                    .replace(/[^A-Za-z0-9]/g, "")
                    .slice(0, 2)
                    .toUpperCase() || "?";
                  return (
                    <tr
                      key={v._id}
                      className={`transition hover:bg-slate-50/80 ${v.removedAt ? "opacity-60" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-[#0B0D12]">
                              {caller}
                            </p>
                            {v.callerName && v.callerNumber && (
                              <p className="font-mono-data text-[11px] text-slate-500">
                                {v.callerNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-semibold text-[#0B0D12]">
                          Ext {v.extensionNumber}
                        </p>
                        {v.extensionName && (
                          <p className="text-[11px] text-slate-500">
                            {v.extensionName}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-mono-data text-[12px] text-slate-700">
                          {v.receivedAt || "—"}
                        </p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-mono-data text-[13px] font-semibold text-[#0B0D12]">
                          {formatDuration(v.duration)}
                        </p>
                      </td>
                      <td className="px-5 py-3">{statusBadge(v)}</td>
                      <td className="px-5 py-3">
                        {v.removedAt ? (
                          <p className="font-mono-data text-[11px] text-slate-500">
                            {new Date(v.removedAt).toLocaleString()}
                          </p>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-500">
              Page{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {page}
              </span>{" "}
              /{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {totalPages}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-2.5 w-28" />
          </div>
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
