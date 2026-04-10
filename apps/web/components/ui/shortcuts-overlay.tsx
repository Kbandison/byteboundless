"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Shortcut {
  keys: string[];
  label: string;
}

interface ShortcutGroup {
  heading: string;
  items: Shortcut[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    heading: "Navigation",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["N"], label: "New search" },
      { keys: ["G", "D"], label: "Go to dashboard" },
      { keys: ["G", "L"], label: "Go to saved lists" },
      { keys: ["G", "S"], label: "Go to settings" },
    ],
  },
  {
    heading: "Search & Results",
    items: [
      { keys: ["/"], label: "Focus search input" },
      { keys: ["F"], label: "Toggle filters" },
      { keys: ["X"], label: "Toggle row selection (when hovering)" },
    ],
  },
  {
    heading: "Help",
    items: [
      { keys: ["?"], label: "Show this overlay" },
      { keys: ["ESC"], label: "Close any overlay" },
    ],
  },
];

export function ShortcutsOverlay() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      // Ignore typing in inputs/textareas/contenteditable
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) return;

      // Modifier keys = bail (let cmd+k etc. handle themselves)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Show shortcuts overlay
      if (e.key === "?") {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key === "Escape") {
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      }

      // n = new search
      if (e.key === "n") {
        e.preventDefault();
        router.push("/search/new");
        return;
      }

      // / = focus in-page search if present, otherwise open command palette
      if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>("input[data-search-input]");
        if (input) {
          input.focus();
        } else {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
        }
        return;
      }

      // Two-key sequences: g d, g l, g s
      const now = Date.now();
      if (lastKey === "g" && now - lastKeyTime < 1000) {
        if (e.key === "d") { e.preventDefault(); router.push("/dashboard"); }
        else if (e.key === "l") { e.preventDefault(); router.push("/lists"); }
        else if (e.key === "s") { e.preventDefault(); router.push("/settings"); }
        lastKey = "";
        return;
      }
      if (e.key === "g") {
        lastKey = "g";
        lastKeyTime = now;
        return;
      }
      lastKey = "";
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            Keyboard shortcuts
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 max-h-[70vh] overflow-y-auto">
          {SHORTCUTS.map((group) => (
            <div key={group.heading}>
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
                {group.heading}
              </p>
              <ul className="space-y-2">
                {group.items.map((s) => (
                  <li key={s.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-[var(--color-text-secondary)]">{s.label}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k) => (
                        <kbd
                          key={k}
                          className="font-[family-name:var(--font-mono)] text-[11px] px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] min-w-[24px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--color-border)] px-6 py-3 bg-[var(--color-bg-secondary)]/30">
          <p className="text-xs text-[var(--color-text-dim)]">
            Press <kbd className="font-[family-name:var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)]">?</kbd> any time to open this overlay
          </p>
        </div>
      </div>
    </div>
  );
}
