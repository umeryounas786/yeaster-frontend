"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, LayoutGrid, LogOut, Menu, X } from "lucide-react";
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

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const displayName = user?.fullName || user?.username || "user";
  const initials = (user?.username || "u").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#0B0D12] px-4 lg:hidden">
        <img
          src="/logo.jpeg"
          alt="CompuVoIP"
          className="h-12 w-auto object-contain"
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[248px] flex-col bg-[#0B0D12] px-[18px] py-6 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-7 flex items-center gap-2">
          <div className="flex flex-1 items-center justify-center px-1 py-2">
            <img
              src="/logo.jpeg"
              alt="CompuVoIP"
              className="h-20 w-auto object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
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
    </>
  );
}
