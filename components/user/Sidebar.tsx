"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutGrid, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import type { UserProfile } from "@/lib/types";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Wallboard", icon: LayoutGrid, exact: true },
  { href: "/dashboard/history", label: "History", icon: Clock },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const { profile, logout } = useAuth();
  const user = profile as UserProfile | null;

  const displayName = user?.fullName || user?.username || "user";
  const initials = (user?.username || "u").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col bg-[#0B0D12] px-[18px] py-6">
      <div className="mb-7 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0062FF] shadow-lg shadow-[#0062FF]/20">
          <div className="h-3.5 w-3.5 rounded-full bg-white" />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-[17px] font-bold leading-tight text-white">
            Yeastar
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Wallboard
          </p>
        </div>
      </div>

      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
        Menu
      </p>
      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3.5 py-[11px] text-sm font-medium transition ${
                active ? "bg-[#0062FF]" : "hover:bg-white/5"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  active
                    ? "text-white"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              />
              <span
                className={`flex-1 ${
                  active
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-200"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-slate-500">
              @{user?.username}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut className="h-4 w-4 text-slate-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}
