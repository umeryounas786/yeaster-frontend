"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Home() {
  const router = useRouter();
  const { status, role } = useAuth();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (role === "super_admin") {
      router.replace("/admin");
    } else {
      router.replace("/dashboard");
    }
  }, [status, role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-sm text-slate-500">Loading…</div>
    </div>
  );
}
