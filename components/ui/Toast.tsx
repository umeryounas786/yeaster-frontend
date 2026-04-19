"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

const typeStyles: Record<
  ToastType,
  { ring: string; icon: React.ReactNode; iconBg: string }
> = {
  success: {
    ring: "ring-emerald-200 dark:ring-emerald-800/60",
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
    iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  error: {
    ring: "ring-rose-200 dark:ring-rose-800/60",
    icon: <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
    iconBg: "bg-rose-50 dark:bg-rose-900/30",
  },
  info: {
    ring: "ring-sky-200 dark:ring-sky-800/60",
    icon: <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
    iconBg: "bg-sky-50 dark:bg-sky-900/30",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const handle = timeouts.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, type, title, description }]);
      const handle = setTimeout(() => remove(id), 4500);
      timeouts.current.set(id, handle);
    },
    [remove]
  );

  useEffect(() => {
    const current = timeouts.current;
    return () => {
      for (const h of current.values()) clearTimeout(h);
      current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      info: (title, description) => push("info", title, description),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:inset-x-auto sm:right-4">
        <div className="flex w-full max-w-sm flex-col gap-2">
          {toasts.map((t) => {
            const style = typeStyles[t.type];
            return (
              <div
                key={t.id}
                role="status"
                className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg bg-white p-3 shadow-lg ring-1 ring-inset transition dark:bg-slate-900 ${style.ring}`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${style.iconBg}`}
                >
                  {style.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
