"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookmarkCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Inbox,
  RefreshCw,
  Search,
  Users as UsersIcon,
  Voicemail as VoicemailIcon,
} from "lucide-react";
import { ApiError, voicemailApi } from "@/lib/api";
import type {
  ExtensionSummary,
  UserProfile,
  WallboardStats,
} from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/admin/PageHeader";

const REFRESH_INTERVAL_MS = 30_000;
const SHOW_NAMES_KEY = "wallboard_show_names";

type FilterKey = "all" | "new" | "read" | "saved";

export default function DashboardPage() {
  const { profile } = useAuth();
  const user = profile as UserProfile | null;

  const [items, setItems] = useState<ExtensionSummary[]>([]);
  const [stats, setStats] = useState<WallboardStats>({
    total: 0,
    unread: 0,
    read: 0,
    saved: 0,
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showNames, setShowNames] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [extensionFilter, setExtensionFilter] = useState<string>("");

  const mountedRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Persist the show-names preference in localStorage per tenant.
  useEffect(() => {
    const saved = localStorage.getItem(SHOW_NAMES_KEY);
    if (saved !== null) setShowNames(saved === "true");
  }, []);
  useEffect(() => {
    localStorage.setItem(SHOW_NAMES_KEY, String(showNames));
  }, [showNames]);

  const load = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      void silent;
      try {
        // Pull the full summary — we filter client-side so search is instant
        // and matches extension numbers exactly.
        const data = await voicemailApi.summary();
        if (!mountedRef.current) return;
        setItems(data.items);
        setStats(data.stats);
        setLastSyncedAt(data.lastSyncedAt);
        setSyncing(data.syncing);
        setError(null);
      } catch (e) {
        if (!mountedRef.current) return;
        setError(
          e instanceof ApiError ? e.message : "Failed to load summary"
        );
      } finally {
        if (mountedRef.current) setInitialLoad(false);
      }
    },
    []
  );

  const triggerSync = useCallback(async () => {
    try {
      await voicemailApi.sync();
      setSyncing(true);
    } catch {
      // Silent — server logs it.
    }
  }, []);

  // Initial load
  useEffect(() => {
    triggerSync();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      triggerSync();
      load({ silent: true });
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll while syncing or DB is empty on first load
  useEffect(() => {
    if (initialLoad) return;
    if (!syncing && items.length > 0) return;
    const id = setInterval(() => load({ silent: true }), 2000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncing, items.length, initialLoad]);

  const displayName = user?.fullName || user?.username || "user";
  const updatedAt = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const filteredItems = items
    .filter((ext) => {
      // Only show users that actually have messages
      if (ext.total === 0) return false;
      // Search — accept "250", "Ext 250", "ext250", or the extension name
      if (search) {
        const raw = search.trim().toLowerCase();
        // Strip leading "ext" / "ext." / "ext " so "Ext 250" matches "250"
        const q = raw.replace(/^ext\.?\s*/i, "").trim();
        const number = ext.extensionNumber.toLowerCase();
        const name = (ext.extensionName || "").toLowerCase();
        const matches =
          (q && (number.includes(q) || name.includes(q))) ||
          name.includes(raw);
        if (!matches) return false;
      }
      // Dropdown
      if (extensionFilter && ext.extensionNumber !== extensionFilter) return false;
      // Status filter
      if (activeFilter === "new") return ext.newCount > 0;
      if (activeFilter === "read") return ext.readCount > 0;
      if (activeFilter === "saved") return ext.savedCount > 0;
      return true;
    })
    .sort((a, b) => {
      const nameA = (a.extensionName || a.extensionNumber).toLowerCase();
      const nameB = (b.extensionName || b.extensionNumber).toLowerCase();
      return nameA.localeCompare(nameB);
    });

  // Auto-scroll the list for the wall-mounted display (no mouse/keyboard)
  useEffect(() => {
    if (!autoScrollEnabled) return;

    const el = scrollRef.current;
    if (!el) return;

    let paused = false;
    let pauseTimer: ReturnType<typeof setTimeout>;

    const tick = setInterval(() => {
      if (!el || paused) return;
      if (el.scrollHeight <= el.clientHeight) return; // nothing to scroll

      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      if (atBottom) {
        paused = true;
        pauseTimer = setTimeout(() => {
          el.scrollTop = 0;
          paused = false;
        }, 3000);
      } else {
        el.scrollTop += 1;
      }
    }, 80); // ~15px/s — slower, easier to read

    return () => {
      clearInterval(tick);
      clearTimeout(pauseTimer);
    };
  }, [filteredItems.length, autoScrollEnabled]);

  return (
    <div>
      <PageHeader
        title="Voicemail Wallboard"
        description={
          updatedAt
            ? `${displayName}'s voicemails · Last synced ${updatedAt}${syncing ? " · syncing…" : ""}`
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
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by extension or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl bg-white pl-10 pr-3 text-xs font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent transition focus:ring-slate-200 sm:w-[260px]"
              />
            </div>
            <button
              type="button"
              onClick={() => setAutoScrollEnabled((enabled) => !enabled)}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-bold transition ${autoScrollEnabled ? "bg-slate-900 text-white hover:bg-slate-700" : "bg-slate-300 text-slate-700 hover:bg-slate-400"}`}
            >
              {autoScrollEnabled ? "Auto-scroll on" : "Auto-scroll off"}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerSync();
                load();
              }}
              disabled={syncing}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#0B0D12] px-4 text-xs font-bold text-white transition hover:bg-[#1F2937] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </>
        }
      />

      {/* Top stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Total Messages"
          value={stats.total}
          loading={initialLoad}
          icon={<VoicemailIcon className="h-4 w-4 text-[#0062FF]" />}
          iconBg="bg-[#EEF2FF]"
          cardBg="bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          valueCls="text-[#0B0D12]"
          captionCls="text-slate-500"
          caption="All voicemails"
        />
        <StatTile
          label="New Messages"
          value={stats.unread}
          loading={initialLoad}
          icon={<Inbox className="h-4 w-4 text-white" />}
          iconBg="bg-[#10B981]"
          cardBg="bg-[#F0FDF4]"
          valueCls="text-[#064E3B]"
          captionCls="text-[#047857] font-semibold"
          caption={stats.unread > 0 ? "Needs attention" : "All handled"}
        />
        <StatTile
          label="Read Messages"
          value={stats.read}
          loading={initialLoad}
          icon={<CheckCircle2 className="h-4 w-4 text-[#DC2626]" />}
          iconBg="bg-[#FEE2E2]"
          cardBg="bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
          valueCls="text-[#0B0D12]"
          captionCls="text-slate-500"
          caption="Handled"
        />
        <StatTile
          label="Saved Messages"
          value={stats.saved}
          loading={initialLoad}
          icon={<BookmarkCheck className="h-4 w-4 text-white" />}
          iconBg="bg-[#DC2626]"
          cardBg="bg-[#FEF2F2]"
          valueCls="text-[#991B1B]"
          captionCls="text-[#B91C1C] font-semibold"
          caption="Marked for follow-up"
        />
      </div>

      {/* Per-user summary panel */}
      <div className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center gap-3">
          {/* Left: title + count + controls + All filter */}
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-base font-bold text-[#0B0D12]">
                Voicemails by User
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono-data text-[11px] font-bold text-slate-600">
                {filteredItems.length} {filteredItems.length === 1 ? "user" : "users"}
              </span>
            </div>
            <select
              value={extensionFilter}
              onChange={(e) => setExtensionFilter(e.target.value)}
              className="h-8 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-transparent focus:ring-slate-200"
              aria-label="Filter by extension"
            >
              <option value="">All extensions</option>
              {items.map((ext) => (
                <option key={ext.extensionNumber} value={ext.extensionNumber}>
                  Ext {ext.extensionNumber}
                  {showNames && ext.extensionName ? ` — ${ext.extensionName}` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNames((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-transparent transition hover:bg-slate-100"
              title={showNames ? "Hide names" : "Show names"}
            >
              {showNames ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showNames ? "Names on" : "Names off"}
            </button>
          </div>

          {/* Right: column header buttons — aligned with row pills */}
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {(
              [
                { key: "all",   label: "All",   base: "bg-slate-200 text-slate-600 hover:bg-slate-300",       active: "bg-[#0B0D12] text-white shadow-sm" },
                { key: "new",   label: "New",   base: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200", active: "bg-emerald-500 text-white shadow-sm" },
                { key: "read",  label: "Read",  base: "bg-rose-100 text-rose-700 hover:bg-rose-200",          active: "bg-rose-600 text-white shadow-sm" },
                { key: "saved", label: "Saved", base: "bg-amber-100 text-amber-700 hover:bg-amber-200",       active: "bg-amber-500 text-white shadow-sm" },
              ] as { key: FilterKey; label: string; base: string; active: string }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setActiveFilter(f.key)}
                className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition ${
                  activeFilter === f.key ? f.active : f.base
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="ml-1 hidden w-14 text-right md:block">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Total
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
            {error}
          </div>
        )}

        {initialLoad ? (
          <RowsSkeleton />
        ) : syncing && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Syncing voicemails from PBX…
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              This can take 10–30 seconds on first load.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={VoicemailIcon}
            title="No voicemails to display"
            description={
              search
                ? "Try adjusting your search."
                : "New voicemails will appear here automatically."
            }
          />
        ) : (
          <div
            ref={scrollRef}
            className="max-h-[calc(100vh-22rem)] overflow-y-auto divide-y divide-slate-100"
          >
            {filteredItems.map((ext) => (
              <ExtensionRow key={ext.extensionNumber} ext={ext} showName={showNames} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Row per extension ─────────────────────────────────────────────

function ExtensionRow({
  ext,
  showName,
}: {
  ext: ExtensionSummary;
  showName: boolean;
}) {
  const label = showName && ext.extensionName
    ? `${ext.extensionName} (Ext ${ext.extensionNumber})`
    : `Ext ${ext.extensionNumber}`;

  const parts: string[] = [];
  parts.push(`${ext.newCount} New`);
  parts.push(`${ext.readCount} Read`);
  if (ext.savedCount > 0 || parts.length > 0) parts.push(`${ext.savedCount} Saved`);

  const initials = showName && ext.extensionName
    ? ext.extensionName
        .split(/\s+/)
        .map((w) => w[0] || "")
        .slice(0, 2)
        .join("")
        .toUpperCase() || ext.extensionNumber.slice(-2)
    : ext.extensionNumber.slice(-2);

  return (
    <div className="flex items-center gap-4 px-2 py-4 transition hover:bg-slate-50/60">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
          ext.newCount > 0
            ? "bg-[#10B981]"
            : ext.savedCount > 0
              ? "bg-[#DC2626]"
              : "bg-slate-500"
        }`}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-[#0B0D12]">
          {label}
          {ext.isGroup && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 align-middle text-[9px] font-bold text-indigo-800 ring-1 ring-inset ring-indigo-300">
              <UsersIcon className="h-2.5 w-2.5" />
              GROUP
            </span>
          )}
        </p>
        <p className="mt-1 truncate text-xs font-medium text-slate-600">
          <span
            className={
              ext.newCount > 0 ? "text-emerald-700" : "text-slate-400"
            }
          >
            {ext.newCount} New
          </span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span
            className={ext.readCount > 0 ? "text-rose-700" : "text-slate-400"}
          >
            {ext.readCount} Read
          </span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span
            className={
              ext.savedCount > 0 ? "text-amber-700" : "text-slate-400"
            }
          >
            {ext.savedCount} Saved
          </span>
        </p>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <CountPill
          value={ext.newCount}
          tone="emerald"
          active={ext.newCount > 0}
        />
        <CountPill
          value={ext.readCount}
          tone="rose"
          active={ext.readCount > 0}
        />
        <CountPill
          value={ext.savedCount}
          tone="amber"
          active={ext.savedCount > 0}
        />
        <div className="ml-1 hidden w-14 text-right md:block">
          <p className="font-mono-data text-[16px] font-bold text-[#0B0D12]">
            {ext.total}
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </p>
        </div>
      </div>
    </div>
  );
}

function CountPill({
  value,
  tone,
  active,
}: {
  value: number;
  tone: "emerald" | "amber" | "rose";
  active: boolean;
}) {
  const cls = !active
    ? "bg-slate-50 text-slate-400 ring-slate-200"
    : tone === "emerald"
      ? "bg-emerald-100 text-emerald-900 ring-emerald-300"
      : tone === "amber"
        ? "bg-amber-100 text-amber-900 ring-amber-300"
        : "bg-rose-100 text-rose-900 ring-rose-300";
  return (
    <span
      className={`inline-flex min-w-[2.25rem] items-center justify-center rounded-lg px-2 py-1 font-mono-data text-[13px] font-bold ring-1 ring-inset ${cls}`}
    >
      {value}
    </span>
  );
}

// ─── Top stat tile (reusable) ──────────────────────────────────────

function StatTile({
  label,
  value,
  loading,
  icon,
  iconBg,
  cardBg,
  valueCls,
  captionCls,
  caption,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
  iconBg: string;
  cardBg: string;
  valueCls: string;
  captionCls: string;
  caption: string;
}) {
  return (
    <div className={`rounded-2xl p-5 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </p>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      {loading ? (
        <Skeleton className="mt-3.5 h-11 w-14" />
      ) : (
        <p
          className={`mt-3.5 font-mono-data text-[44px] font-bold leading-none ${valueCls}`}
        >
          {String(value).padStart(2, "0")}
        </p>
      )}
      <p className={`mt-3 text-xs ${captionCls}`}>{caption}</p>
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2 py-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
          <Skeleton className="hidden h-8 w-10 sm:block" />
          <Skeleton className="hidden h-8 w-10 sm:block" />
          <Skeleton className="hidden h-8 w-10 sm:block" />
        </div>
      ))}
    </div>
  );
}
