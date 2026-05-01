"use client";

import { useEffect, useState } from "react";
import { Megaphone, Save } from "lucide-react";
import { promoApi } from "@/lib/api";
import PageHeader from "@/components/admin/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function PromoPage() {
  const toast = useToast();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    promoApi
      .get()
      .then((data) => setText(data.text))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await promoApi.update(text);
      toast.success("Saved", "Promo message updated for all users");
    } catch {
      toast.error("Failed to save", "Please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Promotional Message"
        description="This message is displayed to all users in the wallboard sidebar. Only you can edit it."
        eyebrow={
          <div className="flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5 text-[#0062FF]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#0062FF]">
              Broadcast
            </span>
          </div>
        }
      />

      <div className="rounded-2xl bg-white p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Message
        </label>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Enter your promotional message here. This will be visible to all users in the wallboard sidebar."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 placeholder-slate-400 focus:border-[#0062FF] focus:outline-none focus:ring-2 focus:ring-[#0062FF]/20"
          />
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">{text.length} characters</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0062FF] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
