"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Settings, BookOpen, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function UserMenu({ collapsed = false }: { collapsed?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [initials, setInitials] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data } = await supabase.from("profiles").select("full_name, plan").eq("id", user.id).single();
      if (data) {
        const p = data as { full_name: string | null; plan: string };
        setPlan(p.plan);
        const name = p.full_name ?? user.email ?? "";
        const parts = name.split(" ").filter(Boolean);
        setInitials(parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase());
      }
    }
    fetch();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // In sidebar (especially when collapsed), the menu opens upward and to the right
  // so it doesn't get clipped by the sidebar bounds.
  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen(!open)}
        className={
          collapsed
            ? "flex items-center justify-center w-full p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors duration-150"
            : "flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors duration-150"
        }
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xs font-semibold shrink-0">
          {initials || "?"}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-sm font-medium text-[var(--color-text-primary)] truncate">{email}</span>
            <ChevronDown className="w-3 h-3 text-[var(--color-text-dim)] shrink-0" />
          </>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-2 w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-sm font-medium truncate">{email}</p>
            <p className="text-xs text-[var(--color-text-dim)] capitalize mt-0.5">{plan} plan</p>
          </div>

          {/* Links */}
          <div className="p-1.5">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </Link>
            <Link
              href="/guide"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Guide
            </Link>
          </div>

          {/* Sign out */}
          <div className="p-1.5 border-t border-[var(--color-border)]">
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>

          {/* Cmd+K hint */}
          <div className="px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
            <p className="text-[10px] text-[var(--color-text-dim)]">
              Press <kbd className="font-[family-name:var(--font-mono)] px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">⌘K</kbd> for quick actions
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
