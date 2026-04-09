"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Trash2, Loader2, Star, Mail, Phone, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { getScoreColor, TECH_STACK_COLORS } from "@/lib/constants";

interface ListItem {
  id: string;
  business_id: string;
  status: string;
  contacted_at: string | null;
  business: {
    id: string;
    name: string;
    category: string | null;
    website: string | null;
    phone: string | null;
    rating: number | null;
    reviews: number | null;
    lead_score: number;
    enrichment: Record<string, unknown> | null;
    job_id: string;
  };
}

export default function ListDetailPage({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const [listName, setListName] = useState("");
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: list } = await supabase
        .from("saved_lists")
        .select("name")
        .eq("id", listId)
        .single();
      if (list) setListName((list as { name: string }).name);

      const { data } = await supabase
        .from("saved_list_items")
        .select("id, business_id, status, contacted_at")
        .eq("list_id", listId);

      if (data && (data as unknown[]).length > 0) {
        const bizIds = (data as { business_id: string }[]).map((d) => d.business_id);
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, category, website, phone, rating, reviews, lead_score, enrichment, job_id")
          .in("id", bizIds);

        const bizMap = new Map<string, Record<string, unknown>>();
        ((businesses ?? []) as Record<string, unknown>[]).forEach((b) => bizMap.set(b.id as string, b));

        const merged = (data as Record<string, unknown>[]).map((item) => ({
          ...item,
          business: bizMap.get(item.business_id as string) ?? { id: item.business_id, name: "Unknown" },
        })) as unknown as ListItem[];

        setItems(merged);
      }
      setLoading(false);
    }
    fetchData();
  }, [listId]);

  async function removeItem(itemId: string) {
    const supabase = createClient();
    await supabase.from("saved_list_items").delete().eq("id", itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-20 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <Link href="/lists" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to lists
      </Link>

      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-2">
        {listName}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        {items.length} lead{items.length !== 1 ? "s" : ""}
      </p>

      {items.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] overflow-hidden divide-y divide-[var(--color-border)]/50">
          {items.map((item) => {
            const biz = item.business;
            const score = biz.lead_score ?? 0;
            const colors = getScoreColor(score);
            const tech = ((biz.enrichment?.techStack as string[]) ?? [])[0];
            const techKey = tech?.toLowerCase().replace("godaddybuilder", "godaddy") ?? "unknown";
            const techColors = TECH_STACK_COLORS[techKey] || TECH_STACK_COLORS.unknown;

            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4 group">
                <span className={cn("inline-flex items-center justify-center w-10 h-7 rounded text-xs font-bold font-[family-name:var(--font-mono)] border", colors.bg, colors.text, colors.border)}>
                  {score}
                </span>
                <Link href={`/search/${biz.job_id}/results/${biz.id}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-[var(--color-accent)] transition-colors">{biz.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--color-text-dim)]">
                    {biz.category && <span>{biz.category}</span>}
                    {tech && <span className={cn("px-1.5 py-0.5 rounded font-medium", techColors.bg, techColors.text)}>{tech}</span>}
                    {biz.phone && <span className="flex items-center gap-0.5"><Phone className="w-3 h-3 text-emerald-500" /></span>}
                    {biz.rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {biz.rating}</span>}
                  </div>
                </Link>
                {item.status === "contacted" && (
                  <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">Contacted</span>
                )}
                <button onClick={() => removeItem(item.id)} className="p-2 text-[var(--color-text-dim)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-sm text-[var(--color-text-secondary)]">
          No leads in this list yet. Save leads from search results.
        </div>
      )}
    </div>
  );
}
