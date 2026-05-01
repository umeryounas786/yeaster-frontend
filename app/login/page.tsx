"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const { status, role, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [status, role, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInRole = await login(username.trim(), password);
      toast.success("Welcome back", `Signed in as @${username.trim()}`);
      router.replace(loggedInRole === "super_admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand Panel (Left) */}
      <div className="hidden w-[44%] flex-col justify-between bg-[#0B0D12] p-14 lg:flex">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="CompuVoIP"
            className="h-28 w-auto object-contain"
          />
        </div>

        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-4 py-1.5 ring-1 ring-inset ring-white/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-white">
              Real-time voicemail intelligence
            </span>
          </div>
          <h1 className="font-heading text-[52px] font-bold leading-[1.05] tracking-tight text-white">
            Never miss
            <br />
            a customer voicemail
            <br />
            again.
          </h1>
        </div>

        <div />
      </div>

      {/* Form Panel (Right) */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile brand */}
          <div className="flex justify-center lg:hidden">
            <img
              src="/logo.png"
              alt="CompuVoIP"
              className="h-auto w-72 max-w-full object-contain"
            />
          </div>

          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-[#0B0D12]">
              Sign in to your dashboard
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Welcome back. Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Username
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  placeholder="superadmin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent transition focus:bg-white focus:outline-none focus:ring-[#0062FF]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl bg-slate-50 pl-11 pr-12 text-sm font-medium text-slate-900 placeholder-slate-400 ring-1 ring-inset ring-transparent transition focus:bg-white focus:outline-none focus:ring-[#0062FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#0B0D12] text-sm font-bold text-white transition hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ height: "52px" }}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
