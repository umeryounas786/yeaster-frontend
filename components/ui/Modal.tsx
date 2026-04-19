"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = "max-w-md",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800`}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div>
              {title && (
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {children && <div className="px-5 py-4">{children}</div>}

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50/50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/30">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  loading,
  onConfirm,
  onClose,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    />
  );
}
