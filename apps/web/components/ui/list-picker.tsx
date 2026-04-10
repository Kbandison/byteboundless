"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Plus, Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { modalBackdrop, modalContent } from "@/lib/motion";

interface List {
  id: string;
  name: string;
}

interface ListPickerProps {
  open: boolean;
  onClose: () => void;
  businessIds: string[];
  onSaved?: (count: number) => void;
}

export function ListPicker({ open, onClose, businessIds, onSaved }: ListPickerProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/lists")
      .then((r) => r.json())
      .then((data) => {
        setLists((data.lists ?? []) as List[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  async function handleSave(listId: string) {
    setSaving(listId);
    try {
      const res = await fetch("/api/lists/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, businessIds }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const list = lists.find((l) => l.id === listId);
      toast.success(`Saved ${businessIds.length} lead${businessIds.length === 1 ? "" : "s"} to "${list?.name}"`);
      onSaved?.(data.count ?? businessIds.length);
      onClose();
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const newList = data.list as List;
      setLists((prev) => [newList, ...prev]);
      // Auto-save to the new list
      await handleSave(newList.id);
      setNewName("");
      setShowCreate(false);
    } catch {
      toast.error("Failed to create list");
    } finally {
      setCreating(false);
    }
  }

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
            onClick={onClose}
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
              Save to list
            </h2>
            <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
              Adding {businessIds.length} lead{businessIds.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-5 h-5 text-[var(--color-text-dim)] animate-spin" />
            </div>
          ) : lists.length === 0 && !showCreate ? (
            <p className="py-6 text-center text-sm text-[var(--color-text-dim)]">
              No lists yet. Create one below.
            </p>
          ) : (
            <ul className="space-y-1">
              {lists.map((list) => (
                <li key={list.id}>
                  <button
                    onClick={() => handleSave(list.id)}
                    disabled={saving !== null}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left truncate">{list.name}</span>
                    {saving === list.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving !== list.id && saving === null && <Check className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] p-3">
          {showCreate ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") { setShowCreate(false); setNewName(""); }
                }}
                placeholder="List name..."
                autoFocus
                className="flex-1 px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="inline-flex items-center justify-center px-4 py-2 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50 font-medium min-w-[80px]"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New list
            </button>
          )}
        </div>
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
