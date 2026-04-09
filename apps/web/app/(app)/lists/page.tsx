"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Plus, Loader2, Trash2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePlan, isPaidPlan } from "@/hooks/use-plan";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface SavedList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  itemCount?: number;
}

export default function SavedListsPage() {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const plan = usePlan();
  const paid = isPaidPlan(plan);

  async function fetchLists() {
    const res = await fetch("/api/lists");
    const data = await res.json();
    if (data.lists) {
      // Get item counts
      const supabase = createClient();
      const listsWithCounts = await Promise.all(
        (data.lists as SavedList[]).map(async (list) => {
          const { count } = await supabase
            .from("saved_list_items")
            .select("id", { count: "exact", head: true })
            .eq("list_id", list.id);
          return { ...list, itemCount: count ?? 0 };
        })
      );
      setLists(listsWithCounts);
    }
    setLoading(false);
  }

  useEffect(() => { fetchLists(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setShowCreate(false);
    setCreating(false);
    fetchLists();
  }

  async function handleDelete(listId: string) {
    const supabase = createClient();
    await supabase.from("saved_lists").delete().eq("id", listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-20 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  if (!paid) {
    return (
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-8">
          Saved Lists
        </h1>
        <UpgradeGate feature="Organize leads into lists, track your outreach pipeline, and manage campaigns" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Saved Lists
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Organize your best prospects across searches.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Create new list */}
      {showCreate && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-bg-tertiary)]">
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="List name..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="flex-1 px-4 py-2.5 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-5 py-2.5 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 font-medium"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(""); }}
              className="px-4 py-2.5 text-sm text-[var(--color-text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {lists.length > 0 ? (
        <div className="space-y-3">
          {lists.map((list) => (
            <div
              key={list.id}
              className="flex items-center justify-between p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)] transition-all duration-300"
            >
              <Link href={`/lists/${list.id}`} className="flex-1">
                <h3 className="text-sm font-semibold hover:text-[var(--color-accent)] transition-colors">{list.name}</h3>
                <p className="text-xs text-[var(--color-text-dim)] mt-1">
                  {list.itemCount} lead{list.itemCount !== 1 ? "s" : ""} &middot;
                  Updated {new Date(list.updated_at).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); handleDelete(list.id); }}
                className="p-2 text-[var(--color-text-dim)] hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-[var(--color-text-dim)]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
            No saved lists yet
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
            Create lists to organize your leads by industry, location, or priority.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            New List
          </button>
        </div>
      )}
    </div>
  );
}
