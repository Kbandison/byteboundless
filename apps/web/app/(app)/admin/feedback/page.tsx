import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";
import { FeedbackRow } from "./row";

type FeedbackItem = {
  id: string;
  user_id: string;
  email: string;
  category: "bug" | "feature" | "question" | "other";
  subject: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  created_at: string;
  resolved_at: string | null;
};

export default async function AdminFeedbackPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as unknown as FeedbackItem[];

  const openCount = items.filter(
    (f) => f.status === "new" || f.status === "in_progress"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.15em] text-red-500 font-medium font-[family-name:var(--font-mono)] mb-2">
          Admin
        </p>
        <div className="flex items-baseline gap-3">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Feedback ({items.length})
          </h1>
          {openCount > 0 && (
            <span className="text-xs uppercase tracking-wider text-amber-600 font-medium">
              {openCount} open
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-12 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            No feedback yet. Users will show up here as they submit.
          </p>
        </div>
      ) : (
        <StaggerContainer tight className="space-y-3">
          {items.map((item) => (
            <StaggerItem row key={item.id}>
              <FeedbackRow item={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
