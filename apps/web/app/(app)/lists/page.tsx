"use client";

import Link from "next/link";
import { Bookmark, Plus, MoreHorizontal } from "lucide-react";

export default function SavedListsPage() {
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
        <button className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300">
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Empty state */}
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center">
          <Bookmark className="w-8 h-8 text-[var(--color-text-dim)]" />
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-2">
          No saved lists yet
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
          Save leads from search results to organize your outreach. Create
          lists by industry, location, or priority.
        </p>
        <Link
          href="/search/new"
          className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-all duration-300"
        >
          Run a search first
        </Link>
      </div>
    </div>
  );
}
