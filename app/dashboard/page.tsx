"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookmarkCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  Search,
  Voicemail as VoicemailIcon,
} from "lucide-react";
import { ApiError, voicemailApi } from "@/lib/api";
import type {
  UserProfile,
  Voicemail,
  WallboardFilter,
  WallboardStats,
} from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import VoicemailCard from "@/components/VoicemailCard";
import PageHeader from "@/components/admin/PageHeader";

const REFRESH_INTERVAL_MS = 30_000;
const PAGE_SIZE = 30;

export default function DashboardPage() {
  const { profile } = useAuth();
  const user = profile as UserProfile | null;
  const toast = useToast();

  const [items, setItems] = useState<Voicemail[]>([]);
  const [stats, setStats] = useState<WallboardStats>({
    total: 0,
    unread: 0,
    read: 0,
    saved: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [readLoading, setReadLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<WallboardFilter>("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Pure DB read. Never touches the PBX — guaranteed fast, guaranteed reliable.
  const loadPage = useCallback(
    async (opts: { silent?: boolean; pageOverride?: number } = {}) => {
      const { silent = false, pageOverride } = opts;
      if (!silent) setReadLoading(true);
      try {
        const data = await voicemailApi.wallboard({
          search: search || undefined,
          filter: activeFilter,
          page: pageOverride ?? page,
          limit: PAGE_SIZE,
        });
        if (!mountedRef.current) return;
        setItems(data.items);
        setStats(data.stats);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLastSyncedAt(data.lastSyncedAt);
        setSyncing(data.syncing);
        if (pageOverride && pageOverride !== page) setPage(pageOverride);
        setError(null);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(
          e instanceof ApiError ? e.message : "Failed to load voicemails"
        );
      } finally {
        if (mountedRef.current) {
          if (!silent) setReadLoading(false);
          setInitialLoad(false);
        }
      }
    },
    [search, activeFilter, page]
  );

  // Fire a background sync — don't block anything. Always safe to call.
  const triggerSync = useCallback(
    async (opts: { showToast?: boolean } = {}) => {
      const { showToast = false } = opts;
      try {
        const res = await voicemailApi.sync();
        if (res.triggered && showToast) {
          toast.info("Refreshing from PBX", "This may take a few seconds");
        }
      } catch (e) {
        // Sync is background — never block the UI. Silent.
        if (showToast) {
          toast.error(
            "Could not refresh from PBX",
            e instanceof ApiError ? e.message : "Will retry automatically"
          );
        }
      }
    },
    [toast]
  );

  // Initial mount — kick off background sync + load page 1.
  useEffect(() => {
    triggerSync();
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced reload on search / filter change — reset to page 1.
  useEffect(() => {
    if (initialLoad) return;
    const handle = setTimeout(() => {
      setPage(1);
      loadPage({ pageOverride: 1 });
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeFilter]);

  // Page change — only reload items, never sync.
  const goToPage = useCallback(
    (next: number) => {
      if (next === page || next < 1 || next > totalPages) return;
      setPage(next);
      loadPage({ pageOverride: next });
    },
    [page, totalPages, loadPage]
  );

  // Auto-refresh — fire background sync + silent page reload.
  useEffect(() => {
    const id = setInterval(() => {
      triggerSync();
      loadPage({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeFilter, page]);

  const onToggleSave = useCallback(
    async (vm: Voicemail) => {
      setSavingId(vm._id);
      try {
        const updated = vm.savedByUser
          ? await voicemailApi.unmarkSaved(vm._id)
          : await voicemailApi.markSaved(vm._id);
        setItems((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p))
        );
        setStats((prev) => {
          if (updated.savedByUser) {
            return {
              ...prev,
              saved: prev.saved + 1,
              unread: vm.isRead ? prev.unread : Math.max(0, prev.unread - 1),
              read: vm.isRead ? Math.max(0, prev.read - 1) : prev.read,
            };
          } else {
            return {
              ...prev,
              saved: Math.max(0, prev.saved - 1),
              unread: vm.isRead ? prev.unread : prev.unread + 1,
              read: vm.isRead ? prev.read + 1 : prev.read,
            };
          }
        });
        toast.success(
          updated.savedByUser ? "Voicemail saved" : "Voicemail unsaved"
        );
      } catch (e) {
        toast.error(
          "Update failed",
          e instanceof ApiError ? e.message : "Please try again"
        );
      } finally {
        setSavingId(null);
      }
    },
    [toast]
  );

  const displayName = user?.fullName || user?.username || "user";
  const updatedAt = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const showingList = useMemo(() => items, [items]);

  return (
    <div>
      <PageHeader
        title="Voicemail Wallboard"
        description={
          updatedAt
            ? `${displayName}'s voicemails  ·  Last synced ${updatedAt}${syncing ? "  ·  syncing…" : ""}`
            : syncing
              ? "Syncing with PBX…"
              : "Ready"
        }
        eyebrow={
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-600">
              Live · Auto-refresh every 30s
            </span>
          </div>
        }
        actions={
          <>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search caller, number, extension…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-[280px] rounded-xl bg-white pl-10 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent transition focus:ring-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                triggerSync({ showToast: true });
                loadPage({ silent: true });
              }}
              disabled={syncing}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0B0D12] px-4 text-xs font-bold text-white transition hover:bg-[#1F2937] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTotal value={stats.total} loading={initialLoad} />
        <StatUnread value={stats.unread} loading={initialLoad} />
        <StatRead value={stats.read} loading={initialLoad} />
        <StatSaved value={stats.saved} loading={initialLoad} />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading text-base font-bold text-[#0B0D12]">
              All voicemails
            </h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-slate-600">
              {total}
            </span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 p-1">
            {(
              [
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "read", label: "Read" },
                { key: "saved", label: "Saved" },
              ] as { key: WallboardFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeFilter === f.key
                    ? "bg-[#0B0D12] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
            {error}
          </div>
        )}

        {initialLoad ? (
          <VoicemailSkeletonList />
        ) : showingList.length === 0 ? (
          <EmptyState
            icon={VoicemailIcon}
            title={
              activeFilter !== "all"
                ? `No ${activeFilter} voicemails`
                : "No voicemails to display"
            }
            description={
              search
                ? "Try adjusting your search."
                : syncing
                  ? "Still syncing from the PBX…"
                  : "New voicemails will appear here automatically."
            }
          />
        ) : (
          <div
            className={`space-y-2.5 transition-opacity ${readLoading ? "opacity-60" : ""}`}
          >
            {showingList.map((v) => (
              <VoicemailCard
                key={v._id}
                voicemail={v}
                onToggleSave={onToggleSave}
                saving={savingId === v._id}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && !initialLoad && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {rangeStart}-{rangeEnd}
              </span>{" "}
              of{" "}
              <span className="font-mono-data font-semibold text-[#0B0D12]">
                {total}
              </span>{" "}
              voicemails
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || readLoading}
                onClick={() => goToPage(page - 1)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              <span className="font-mono-data text-xs font-semibold text-slate-600">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || readLoading}
                onClick={() => goToPage(page + 1)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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

function StatTotal({ value, loading }: { value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Total
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EEF2FF]">
          <VoicemailIcon className="h-4 w-4 text-[#0062FF]" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-11 w-14" />
      ) : (
        <p className="mt-3.5 font-mono-data text-[44px] font-bold leading-none text-[#0B0D12]">
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">All voicemails today</p>
    </div>
  );
}

function StatUnread({ value, loading }: { value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-[#FEF2F2] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#B91C1C]">
          Unread
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DC2626]">
          <Inbox className="h-4 w-4 text-white" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-11 w-14" />
      ) : (
        <p className="mt-3.5 font-mono-data text-[44px] font-bold leading-none text-[#991B1B]">
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className="mt-3 text-xs font-semibold text-[#B91C1C]">
        {value > 0 ? "Needs attention" : "All handled"}
      </p>
    </div>
  );
}

function StatRead({ value, loading }: { value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          Read
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF3C7]">
          <CheckCircle2 className="h-4 w-4 text-[#D97706]" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-11 w-14" />
      ) : (
        <p className="mt-3.5 font-mono-data text-[44px] font-bold leading-none text-[#0B0D12]">
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">Handled today</p>
    </div>
  );
}

function StatSaved({ value, loading }: { value: number; loading: boolean }) {
  return (
    <div className="rounded-2xl bg-[#0B0D12] p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400">
          Saved
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#10B981]">
          <BookmarkCheck className="h-4 w-4 text-white" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-11 w-14" />
      ) : (
        <p className="mt-3.5 font-mono-data text-[44px] font-bold leading-none text-white">
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">Marked for follow-up</p>
    </div>
  );
}

function VoicemailSkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4"
        >
          <div className="h-[60px] w-1 rounded-full bg-slate-200" />
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-10 w-[110px] md:block" />
          <Skeleton className="hidden h-10 w-[80px] md:block" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}
