"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import Button from "./ui/Button";

interface Props {
  title: string;
  navItems?: { href: string; label: string }[];
}

export default function TopBar({ title, navItems = [] }: Props) {
  const { profile, logout, role } = useAuth();

  const displayName =
    profile && "fullName" in profile && profile.fullName
      ? profile.fullName
      : profile?.username ?? "";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-6">
        <Link
          href={role === "super_admin" ? "/admin" : "/dashboard"}
          className="text-lg font-semibold text-slate-900 dark:text-slate-50"
        >
          {title}
        </Link>

        <nav className="hidden gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {role === "super_admin" ? "Super Admin" : "User"}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
