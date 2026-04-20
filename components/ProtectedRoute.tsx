"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/lib/types";

interface Props {
  allow: Role;
  children: React.ReactNode;
}

export default function ProtectedRoute({ allow, children }: Props) {
  const { status, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && role !== allow) {
      router.replace(role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [status, role, allow, router]);

  if (status !== "authenticated" || role !== allow) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-sm text-slate-500">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}
