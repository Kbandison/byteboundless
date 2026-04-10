"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bookmark,
  Settings,
  Plus,
  Menu,
  X,
  Shield,
  LogOut,
  BookOpen,
  Sun,
  Moon,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { APP_NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/hooks/use-theme";
import { CommandPalette } from "@/components/ui/command-palette";
import { UserMenu } from "@/components/ui/user-menu";
import { ShortcutsOverlay } from "@/components/ui/shortcuts-overlay";
import { UpgradePromo } from "@/components/ui/upgrade-promo";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Bookmark,
  Settings,
  BookOpen,
};

const SIDEBAR_KEY = "bb-sidebar-collapsed";

// useSyncExternalStore-friendly subscribe: storage events fire on other tabs;
// we also dispatch our own custom event when toggling locally so all subscribers update.
function subscribeSidebar(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener("bb-sidebar-toggle", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("bb-sidebar-toggle", handler);
  };
}
function getSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_KEY) === "1";
}
function getSidebarCollapsedSSR() {
  return false;
}

export function AppSidebar() {
  const { setTheme, mounted, isDark } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(subscribeSidebar, getSidebarCollapsed, getSidebarCollapsedSSR);
  const [isAdmin, setIsAdmin] = useState(false);

  // Sync sidebar width to a CSS var on <html> so the layout's padding-left updates
  useEffect(() => {
    document.documentElement.style.setProperty("--app-sidebar-w", collapsed ? "72px" : "240px");
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => {
    const next = !getSidebarCollapsed();
    localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event("bb-sidebar-toggle"));
  }, []);

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

  // Sidebar width — when collapsed, only icons; expanded shows labels
  const widthClass = collapsed ? "md:w-[72px]" : "md:w-[240px]";

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--color-text-primary)]"
        >
          ByteBoundless
        </Link>
        <button
          className="p-3 -mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex fixed top-0 left-0 h-screen z-40 flex-col bg-[var(--color-bg-tertiary)] border-r border-[var(--color-border)] transition-[width] duration-200",
          widthClass
        )}
      >
        {/* Logo + collapse toggle */}
        <div className={cn(
          "h-16 flex items-center border-b border-[var(--color-border)] shrink-0 group/header",
          collapsed ? "justify-center px-2" : "px-4 justify-between gap-2"
        )}>
          <Link
            href="/dashboard"
            className="font-[family-name:var(--font-display)] font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2 min-w-0"
          >
            {collapsed ? (
              <span className="w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center text-sm">B</span>
            ) : (
              <span className="text-lg truncate">ByteBoundless</span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-md text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors opacity-0 group-hover/header:opacity-100 focus:opacity-100"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Floating expand button when collapsed — sits on the right edge of the sidebar */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="absolute top-[60px] -right-3 z-10 w-6 h-6 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]/30 flex items-center justify-center shadow-sm transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* New Search button */}
        <div className={cn("py-4 shrink-0", collapsed ? "px-3" : "px-4")}>
          <Link
            href="/search/new"
            className={cn(
              "flex items-center gap-2 text-sm bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors duration-200 font-medium",
              collapsed
                ? "w-12 h-12 justify-center mx-auto"
                : "w-full px-4 py-2.5 justify-center"
            )}
            title="New Search"
          >
            <Plus className={collapsed ? "w-5 h-5" : "w-4 h-4"} />
            {!collapsed && "New Search"}
          </Link>
        </div>

        {/* Nav Links */}
        <nav className={cn("flex-1 overflow-y-auto", collapsed ? "px-3" : "px-4")}>
          <ul className="space-y-1">
            {APP_NAV_LINKS.map((link) => {
              const Icon = ICON_MAP[link.icon];
              const isActive = pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-200",
                      collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                      isActive
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                    )}
                    title={collapsed ? link.label : undefined}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" />}
                    {!collapsed && link.label}
                  </Link>
                </li>
              );
            })}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-200",
                    collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5",
                    pathname.startsWith("/admin")
                      ? "bg-red-500/10 text-red-600"
                      : "text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-500/5"
                  )}
                  title={collapsed ? "Admin" : undefined}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!collapsed && "Admin"}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Footer area */}
        <div className={cn("border-t border-[var(--color-border)] shrink-0 py-3 space-y-2", collapsed ? "px-3" : "px-4")}>
          {/* Upgrade promo (hidden for agency users) */}
          <UpgradePromo collapsed={collapsed} />

          {/* Quick search trigger — opens the command palette which searches leads, lists, searches & pages */}
          {!collapsed && (
            <button
              type="button"
              onClick={() => {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">Search everything</span>
              <kbd className="font-[family-name:var(--font-mono)] text-[10px] px-1.5 py-0.5 rounded border border-[var(--color-border)]">⌘K</kbd>
            </button>
          )}

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors",
                collapsed ? "justify-center px-0 py-3" : "px-3 py-2"
              )}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
              {!collapsed && (isDark ? "Light mode" : "Dark mode")}
            </button>
          )}

          {/* User menu */}
          <div className={cn("pt-2 mt-1 border-t border-[var(--color-border)]", collapsed && "flex justify-center")}>
            <UserMenu collapsed={collapsed} />
          </div>
        </div>
      </aside>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[var(--color-bg-tertiary)] pt-16 overflow-y-auto">
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
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200",
                  pathname.startsWith("/admin")
                    ? "bg-red-500/10 text-red-600"
                    : "text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-500/5"
                )}
              >
                <Shield className="w-5 h-5" />
                Admin
              </Link>
            )}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
              <Link
                href="/search/new"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full text-sm bg-[var(--color-accent)] text-white px-5 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Search
              </Link>
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors duration-200"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {isDark ? "Light Mode" : "Dark Mode"}
                </button>
              )}
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

      {/* Command Palette + Shortcuts Overlay — global */}
      <CommandPalette />
      <ShortcutsOverlay />
    </>
  );
}
