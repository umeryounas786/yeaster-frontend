"use client";

import { useMemo } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { Voicemail as VoicemailType } from "@/lib/types";

interface Props {
  voicemail: VoicemailType;
  onToggleSave: (vm: VoicemailType) => void;
  saving?: boolean;
}

const AVATAR_COLORS = [
  "#DC2626",
  "#7C3AED",
  "#0062FF",
  "#F59E0B",
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

function parseYeastarDate(s: string): Date | null {
  if (!s) return null;
  const normalized = s.replace(/\//g, "-").replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeSince(date: Date | null): string {
  if (!date) return "—";
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const rem = mins % 60;
    return rem ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
  }
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTime(s: string): string {
  if (!s) return "—";
  const [, time] = s.split(" ");
  return time ? time.slice(0, 5) : s;
}

interface Tone {
  card: string;
  strip: string;
  badgeBg: string;
  badgeText: string;
  badgeDot: string;
  label: string;
  nameColor: string;
  metaColor: string;
  timeColor: string;
  timeLabelColor: string;
  durationColor: string;
  subColor: string;
}

const UNREAD: Tone = {
  card: "bg-[#FFFBFB]",
  strip: "bg-[#DC2626]",
  badgeBg: "bg-[#DC2626]",
  badgeText: "text-white",
  badgeDot: "bg-white",
  label: "UNREAD",
  nameColor: "text-[#0B0D12]",
  metaColor: "text-slate-500",
  timeColor: "text-[#0B0D12]",
  timeLabelColor: "text-slate-400",
  durationColor: "text-[#0B0D12]",
  subColor: "text-slate-500",
};

const READ: Tone = {
  card: "bg-white",
  strip: "bg-[#F59E0B]",
  badgeBg: "bg-[#FEF3C7]",
  badgeText: "text-[#92400E]",
  badgeDot: "bg-[#D97706]",
  label: "READ",
  nameColor: "text-[#4B5563]",
  metaColor: "text-slate-400",
  timeColor: "text-[#4B5563]",
  timeLabelColor: "text-slate-400",
  durationColor: "text-[#4B5563]",
  subColor: "text-slate-400",
};

const SAVED: Tone = {
  card: "bg-[#F0FDF4]",
  strip: "bg-[#10B981]",
  badgeBg: "bg-[#10B981]",
  badgeText: "text-white",
  badgeDot: "bg-white",
  label: "SAVED",
  nameColor: "text-[#0B0D12]",
  metaColor: "text-[#047857]",
  timeColor: "text-[#064E3B]",
  timeLabelColor: "text-[#065F46]",
  durationColor: "text-[#064E3B]",
  subColor: "text-[#047857]",
};

export default function VoicemailCard({
  voicemail: v,
  onToggleSave,
  saving,
}: Props) {
  const received = useMemo(
    () => parseYeastarDate(v.receivedAt),
    [v.receivedAt]
  );

  const tone: Tone = v.savedByUser ? SAVED : !v.isRead ? UNREAD : READ;

  const callerDisplay = v.callerName || v.callerNumber || "Unknown";
  const initials = (v.callerName || v.callerNumber || "?")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();
  const avColor = v.savedByUser
    ? "#10B981"
    : !v.isRead
      ? "#DC2626"
      : avatarColor(callerDisplay);

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl p-4 transition hover:shadow-sm ${tone.card}`}
    >
      {/* Colored strip */}
      <div className={`h-[60px] w-1 shrink-0 rounded-full ${tone.strip}`} />

      {/* Avatar */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: avColor }}
      >
        {initials}
      </div>

      {/* Caller info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={`truncate font-heading text-[15px] font-bold ${tone.nameColor}`}>
            {callerDisplay}
          </p>
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${tone.badgeBg} ${tone.badgeText}`}
          >
            <span className={`h-1 w-1 rounded-full ${tone.badgeDot}`} />
            {tone.label}
          </span>
        </div>
        <p className={`mt-1 truncate text-xs ${tone.metaColor}`}>
          {v.callerName && v.callerNumber ? (
            <>
              <span className="font-mono-data">{v.callerNumber}</span>
              {"  ·  "}
            </>
          ) : null}
          Ext {v.extensionNumber}
          {v.extensionName ? ` · ${v.extensionName}` : ""}
        </p>
      </div>

      {/* Received time */}
      <div className="hidden w-[110px] shrink-0 text-right md:block">
        <p className={`text-[9px] font-bold uppercase tracking-[0.1em] ${tone.timeLabelColor}`}>
          Received
        </p>
        <p className={`mt-1 font-mono-data text-[15px] font-bold ${tone.timeColor}`}>
          {formatTime(v.receivedAt)}
        </p>
        <p className={`text-[11px] ${tone.subColor}`}>{timeSince(received)}</p>
      </div>

      {/* Duration */}
      <div className="hidden w-[80px] shrink-0 text-right md:block">
        <p className={`text-[9px] font-bold uppercase tracking-[0.1em] ${tone.timeLabelColor}`}>
          Duration
        </p>
        <p className={`mt-1 font-mono-data text-[17px] font-bold ${tone.durationColor}`}>
          {formatDuration(v.duration)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          aria-label={v.savedByUser ? "Unsave" : "Save"}
          onClick={() => onToggleSave(v)}
          disabled={saving}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition disabled:opacity-50 ${
            v.savedByUser
              ? "bg-[#10B981] text-white hover:brightness-110"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {v.savedByUser ? (
            <BookmarkCheck className="h-3.5 w-3.5" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
