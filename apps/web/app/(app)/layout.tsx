import type { Metadata } from "next";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { NavProgress } from "@/components/ui/nav-progress";

// Everything under (app) is behind auth — /dashboard, /search, /lists,
// /settings, /admin, /feedback, etc. None of it should ever appear in
// search results, so we noindex the whole tree at the layout level.
// Middleware redirects unauthenticated users to /login anyway, but the
// noindex header is the real search-engine boundary.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <NavProgress />
      <AppSidebar />
      {/* Mobile top bar is 64px; desktop sidebar width is set via --app-sidebar-w CSS var */}
      <main className="pt-16 md:pt-0 md:pl-[var(--app-sidebar-w,240px)] transition-[padding-left] duration-200">
        {children}
      </main>
    </div>
  );
}
