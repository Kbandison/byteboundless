"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MessageSquarePlus,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  Loader2,
  Send,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";

type Category = "bug" | "feature" | "question" | "other";
type Status = "new" | "in_progress" | "resolved" | "closed";

interface Feedback {
  id: string;
  category: Category;
  subject: string;
  message: string;
  status: Status;
  created_at: string;
  resolved_at: string | null;
}

const CATEGORIES: { value: Category; label: string; icon: typeof Bug; description: string }[] = [
  { value: "bug", label: "Bug", icon: Bug, description: "Something broken or unexpected" },
  { value: "feature", label: "Feature request", icon: Lightbulb, description: "An idea that'd make this better" },
  { value: "question", label: "Question", icon: HelpCircle, description: "How do I…?" },
  { value: "other", label: "Other", icon: MoreHorizontal, description: "Anything else on your mind" },
];

const STATUS_LABELS: Record<Status, string> = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

function StatusChip({ status }: { status: Status }) {
  const config: Record<
    Status,
    { label: string; classes: string; icon: typeof Clock }
  > = {
    new: {
      label: STATUS_LABELS.new,
      classes: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
      icon: Clock,
    },
    in_progress: {
      label: STATUS_LABELS.in_progress,
      classes: "bg-amber-500/15 text-amber-700",
      icon: Loader2,
    },
    resolved: {
      label: STATUS_LABELS.resolved,
      classes: "bg-emerald-500/15 text-emerald-700",
      icon: CheckCircle2,
    },
    closed: {
      label: STATUS_LABELS.closed,
      classes: "bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)]",
      icon: XCircle,
    },
  };
  const { label, classes, icon: Icon } = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-medium",
        classes
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function FeedbackPage() {
  const [submissions, setSubmissions] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [category, setCategory] = useState<Category>("bug");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Expanded row for viewing full message
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    setSubmissions((data ?? []) as unknown as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      toast.error("Subject and message are required");
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Couldn't send feedback");
        return;
      }
      toast.success("Feedback sent — check your email for a receipt");
      // Reset form
      setSubject("");
      setMessage("");
      setCategory("bug");
      setShowForm(false);
      // Optimistic: prepend the new row and then refetch to sync
      if (data.feedback) {
        setSubmissions((prev) => [data.feedback as Feedback, ...prev]);
      }
      await fetchFeedback();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-2">
          Feedback
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tracking-tight">
          Send us feedback
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2 leading-relaxed">
          Found a bug, have an idea, or got stuck on something? We read every
          message — a real human will reply to you via email. You&apos;ll also get
          a confirmation receipt with a copy of your submission.
        </p>
      </div>

      {/* New feedback button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full mb-8 inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New feedback
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">New submission</h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSubject("");
                setMessage("");
                setCategory("bug");
              }}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
              disabled={submitting}
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>

          {/* Category */}
          <label className="block text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">
            Category
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const selected = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  disabled={submitting}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors",
                    selected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)]"
                      : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                  )}
                  title={c.description}
                >
                  <Icon className="w-4 h-4" />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Subject */}
          <label
            htmlFor="feedback-subject"
            className="block text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2"
          >
            Subject
          </label>
          <input
            id="feedback-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
            maxLength={200}
            placeholder="Short summary"
            className="w-full mb-5 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 disabled:opacity-50"
            required
          />

          {/* Message */}
          <label
            htmlFor="feedback-message"
            className="block text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2"
          >
            Message
          </label>
          <textarea
            id="feedback-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            maxLength={5000}
            rows={6}
            placeholder={
              category === "bug"
                ? "What happened? What did you expect? Steps to reproduce if you can."
                : category === "feature"
                  ? "Describe the feature and why it'd help your workflow."
                  : "Share the details…"
            }
            className="w-full mb-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/10 resize-y disabled:opacity-50 leading-relaxed"
            required
          />
          <p className="text-[11px] text-[var(--color-text-dim)] mb-5 text-right font-[family-name:var(--font-mono)]">
            {message.length}/5000
          </p>

          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending&hellip;
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send feedback
              </>
            )}
          </button>
        </form>
      )}

      {/* Past submissions */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
          Your submissions
        </p>
        {loading ? (
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-center">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-dim)] mx-auto" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-center">
            <Inbox className="w-8 h-8 text-[var(--color-text-dim)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              No submissions yet. Send us something above.
            </p>
          </div>
        ) : (
          <StaggerContainer tight className="space-y-2">
            {submissions.map((f) => {
              const category = CATEGORIES.find((c) => c.value === f.category);
              const Icon = category?.icon ?? MoreHorizontal;
              const isExpanded = expandedId === f.id;
              return (
                <StaggerItem row key={f.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : f.id)}
                    className="w-full text-left p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-medium truncate">{f.subject}</p>
                          <StatusChip status={f.status} />
                        </div>
                        <p className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)]">
                          {new Date(f.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {" · "}
                          {category?.label ?? f.category}
                        </p>
                        {isExpanded && (
                          <p className="mt-3 text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                            {f.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
        <p className="text-[11px] text-[var(--color-text-dim)] mt-4 leading-relaxed text-center">
          Status changes are posted here as we work through your request. We&apos;ll
          reply via email — check your inbox (and{" "}
          <Link href="/settings#notifications" className="text-[var(--color-accent)] hover:underline">
            spam folder
          </Link>
          ) for updates.
        </p>
      </div>
    </div>
  );
}
