"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { usePlan, isPaidPlan } from "@/hooks/use-plan";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion-stagger";

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

  // fetchLists is async — all its setState calls happen after an await,
  // so they're in a later microtask and not "synchronously within an
  // effect." The lint rule can't see through the function call, so we
  // disable it for this known-good data-fetching pattern.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { fetchLists(); }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      toast.success(`Created "${newName.trim()}"`);
    } else {
      toast.error("Failed to create list");
    }
    setNewName("");
    setShowCreate(false);
    setCreating(false);
    fetchLists();
  }

  // Undo-capable delete: remove optimistically, show a toast with an Undo
  // action, and only actually delete from the DB after the undo window
  // expires. If the user clicks Undo (or the delete fails), we restore the
  // list to the UI.
  function handleDelete(listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    // Remember the list's position so Undo puts it back where it was
    const originalIndex = lists.findIndex((l) => l.id === listId);

    // Optimistic removal
    setLists((prev) => prev.filter((l) => l.id !== listId));

    // Undo flag — captured by both the toast action and the commit timer.
    // If the user clicks Undo, this flips to true and the commit bails out.
    let undone = false;

    toast(`Deleted "${list.name}"`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          setLists((prev) => {
            const next = [...prev];
            next.splice(originalIndex, 0, list);
            return next;
          });
        },
      },
    });

    // After the undo window closes, commit the delete. If the user clicked
    // Undo, skip. If the DB delete fails (unlikely), restore and show an
    // error toast.
    setTimeout(async () => {
      if (undone) return;
      const supabase = createClient();
      const { error } = await supabase.from("saved_lists").delete().eq("id", listId);
      if (error) {
        toast.error("Failed to delete list — restoring");
        setLists((prev) => {
          const next = [...prev];
          next.splice(originalIndex, 0, list);
          return next;
        });
      }
    }, 5000);
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
              className="inline-flex items-center justify-center min-w-[100px] px-5 py-2.5 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 font-medium"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
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
        <StaggerContainer className="space-y-3">
          {lists.map((list) => (
            <StaggerItem
              key={list.id}
              className="flex items-center justify-between p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-hover)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
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
            </StaggerItem>
          ))}
        </StaggerContainer>
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
