"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bookmark,
  Settings,
  Plus,
  Menu,
  X,
  Shield,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { APP_NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Bookmark,
  Settings,
};

export function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if ((data as { role: string } | null)?.role === "admin") setIsAdmin(true);
    }
    checkAdmin();
  }, []);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 h-16 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
        <div className="mx-auto max-w-7xl px-6 md:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            ByteBoundless
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {APP_NAV_LINKS.map((link) => {
              const Icon = ICON_MAP[link.icon];
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200",
                  pathname.startsWith("/admin")
                    ? "bg-red-500/10 text-red-600"
                    : "text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50"
                )}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
            <Link
              href="/search/new"
              className="flex items-center gap-2 text-sm bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors duration-200 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Search
            </Link>
            <button
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[var(--color-bg-tertiary)] pt-16">
          <div className="flex flex-col p-6 gap-2">
            {APP_NAV_LINKS.map((link) => {
              const Icon = ICON_MAP[link.icon];
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200",
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                  )}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
              <Link
                href="/search/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-sm bg-[var(--color-accent)] text-white px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Search
              </Link>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = "/";
                }}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
