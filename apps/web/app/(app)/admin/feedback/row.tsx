"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "bug" | "feature" | "question" | "other";
type Status = "new" | "in_progress" | "resolved" | "closed";

interface FeedbackItem {
  id: string;
  user_id: string;
  email: string;
  category: Category;
  subject: string;
  message: string;
  status: Status;
  created_at: string;
  resolved_at: string | null;
}

const CATEGORY_ICONS: Record<Category, typeof Bug> = {
  bug: Bug,
  feature: Lightbulb,
  question: HelpCircle,
  other: MoreHorizontal,
};

const CATEGORY_LABELS: Record<Category, string> = {
  bug: "Bug",
  feature: "Feature request",
  question: "Question",
  other: "Other",
};

const STATUS_CLASSES: Record<Status, string> = {
  new: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  in_progress: "bg-amber-500/15 text-amber-700",
  resolved: "bg-emerald-500/15 text-emerald-700",
  closed: "bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]",
};

const STATUS_OPTIONS: Status[] = ["new", "in_progress", "resolved", "closed"];
const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function FeedbackRow({ item }: { item: FeedbackItem }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [localStatus, setLocalStatus] = useState<Status>(item.status);
  const Icon = CATEGORY_ICONS[item.category];

  async function changeStatus(newStatus: Status) {
    if (newStatus === localStatus) return;
    setUpdating(true);
    const prev = localStatus;
    setLocalStatus(newStatus); // optimistic
    try {
      const res = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId: item.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLocalStatus(prev);
        toast.error(data.error || "Update failed");
        return;
      }
      toast.success(`Marked ${STATUS_LABELS[newStatus].toLowerCase()}`);
      router.refresh();
    } catch (err) {
      setLocalStatus(prev);
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-[var(--color-bg-secondary)]/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold truncate">{item.subject}</p>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium",
                  STATUS_CLASSES[localStatus]
                )}
              >
                {STATUS_LABELS[localStatus]}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-dim)]">
              <span className="text-[var(--color-text-secondary)] font-medium">
                {item.email}
              </span>
              {" · "}
              {CATEGORY_LABELS[item.category]}
              {" · "}
              <span className="font-[family-name:var(--font-mono)]">
                {new Date(item.created_at).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-dim)] shrink-0 mt-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-dim)] shrink-0 mt-1" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--color-border)] p-4 space-y-4">
          <div className="p-4 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">
              Message
            </p>
            <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
              {item.message}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium mr-1">
              Status:
            </p>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeStatus(s);
                }}
                disabled={updating || s === localStatus}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-md border font-medium transition-colors disabled:cursor-default",
                  s === localStatus
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                )}
              >
                {updating && s === localStatus ? (
                  <Loader2 className="w-3 h-3 animate-spin inline" />
                ) : (
                  STATUS_LABELS[s]
                )}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[var(--color-text-dim)]">
            Reply by emailing{" "}
            <a
              href={`mailto:${item.email}?subject=Re:%20${encodeURIComponent(item.subject)}`}
              className="text-[var(--color-accent)] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {item.email}
            </a>{" "}
            directly — or the inbound notification on support@ has a ready-to-reply
            thread.
          </p>
        </div>
      )}
    </div>
  );
}
