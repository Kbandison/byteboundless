"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search, LayoutDashboard, Plus, Bookmark, Settings, BookOpen,
  Sun, Moon, LogOut, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/use-theme";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { setTheme, isDark, mounted } = useTheme();

  // Global keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Check admin
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if ((data as { role: string } | null)?.role === "admin") setIsAdmin(true);
    }
    check();
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center gap-3 px-4 border-b border-[var(--color-border)]">
            <Search className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
            <Command.Input
              placeholder="Search pages, actions..."
              autoFocus
              className="w-full py-3.5 text-sm bg-transparent outline-none placeholder:text-[var(--color-text-dim)]"
            />
            <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-dim)] font-[family-name:var(--font-mono)]">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--color-text-dim)]">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
              <Command.Item onSelect={() => go("/dashboard")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Command.Item>
              <Command.Item onSelect={() => go("/search/new")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                <Plus className="w-4 h-4" /> New Search
              </Command.Item>
              <Command.Item onSelect={() => go("/lists")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                <Bookmark className="w-4 h-4" /> Saved Lists
              </Command.Item>
              <Command.Item onSelect={() => go("/settings")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                <Settings className="w-4 h-4" /> Settings
              </Command.Item>
              <Command.Item onSelect={() => go("/guide")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                <BookOpen className="w-4 h-4" /> Guide
              </Command.Item>
              {isAdmin && (
                <Command.Item onSelect={() => go("/admin")} className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]">
                  <Shield className="w-4 h-4" /> Admin Portal
                </Command.Item>
              )}
            </Command.Group>

            <Command.Separator className="my-2 h-px bg-[var(--color-border)]" />

            <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--color-text-dim)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-medium">
              {mounted && (
                <Command.Item
                  onSelect={() => { setTheme(isDark ? "light" : "dark"); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-[var(--color-accent)]/10 data-[selected=true]:text-[var(--color-accent)]"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? "Switch to light mode" : "Switch to dark mode"}
                </Command.Item>
              )}
              <Command.Item
                onSelect={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg cursor-pointer text-[var(--color-text-secondary)] data-[selected=true]:bg-red-500/10 data-[selected=true]:text-red-500"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="border-t border-[var(--color-border)] px-4 py-2 flex items-center gap-4 text-[10px] text-[var(--color-text-dim)]">
            <span><kbd className="font-[family-name:var(--font-mono)] px-1 py-0.5 rounded border border-[var(--color-border)]">↑↓</kbd> navigate</span>
            <span><kbd className="font-[family-name:var(--font-mono)] px-1 py-0.5 rounded border border-[var(--color-border)]">↵</kbd> select</span>
            <span><kbd className="font-[family-name:var(--font-mono)] px-1 py-0.5 rounded border border-[var(--color-border)]">esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
