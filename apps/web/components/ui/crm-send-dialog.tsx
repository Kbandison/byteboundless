"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, X } from "lucide-react";
import { modalBackdrop, modalContent } from "@/lib/motion";

interface CrmSetter {
  email: string;
  name: string;
  role: string;
  isSetter: boolean;
}

interface CrmSendDialogProps {
  open: boolean;
  onClose: () => void;
  businessIds: string[];
  /** Sends the batch; resolves when the push finishes. */
  onSend: (ids: string[], assignTo: string | null) => Promise<void>;
}

const LAST_ASSIGNEE_KEY = "crm-last-assignee";

/**
 * Confirm a push and pick whose call list it lands on.
 *
 * The owner does the searching and hands batches to whoever will dial them, so
 * the assignee is the real decision here — the count is just a guard against
 * pushing a whole filtered page by accident.
 */
export function CrmSendDialog({ open, onClose, businessIds, onSend }: CrmSendDialogProps) {
  const [setters, setSetters] = useState<CrmSetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // "" = whoever is pushing, which is what the CRM defaults to.
  const [assignTo, setAssignTo] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    fetch("/api/crm/setters")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const list = (data.setters ?? []) as CrmSetter[];
        setSetters(list);
        // Prefer the last person you assigned to, then the first real setter —
        // batch after batch usually goes to the same person.
        const remembered = window.localStorage.getItem(LAST_ASSIGNEE_KEY);
        const match = list.find((s) => s.email === remembered);
        setAssignTo(match?.email ?? list.find((s) => s.isSetter)?.email ?? "");
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function handleSend() {
    setSending(true);
    try {
      if (assignTo) window.localStorage.setItem(LAST_ASSIGNEE_KEY, assignTo);
      await onSend(businessIds, assignTo || null);
      onClose();
    } finally {
      setSending(false);
    }
  }

  const count = businessIds.length;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            variants={modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={sending ? undefined : onClose}
          />
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
                  Send to CRM
                </h2>
                <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
                  {count} {count === 1 ? "business" : "businesses"}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={sending}
                className="p-1 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="crm_assignee"
                  className="block text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium"
                >
                  Assign to
                </label>
                {loading ? (
                  <div className="py-3 flex justify-center">
                    <Loader2 className="w-4 h-4 text-[var(--color-text-dim)] animate-spin" />
                  </div>
                ) : (
                  <select
                    id="crm_assignee"
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    disabled={sending}
                    className="w-full h-10 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Me (whoever is pushing)</option>
                    {setters.map((s) => (
                      <option key={s.email} value={s.email}>
                        {s.name} · {s.role}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-[var(--color-text-dim)]">
                  They land on that person&apos;s call list. Anything already
                  being called is skipped.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--color-border)]">
              <button
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || loading || count === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? "Sending..." : `Send ${count}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
