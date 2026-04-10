import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <AppSidebar />
      {/* Mobile top bar is 64px; desktop sidebar width is set via --app-sidebar-w CSS var */}
      <main className="pt-16 md:pt-0 md:pl-[var(--app-sidebar-w,240px)] transition-[padding-left] duration-200">
        {children}
      </main>
    </div>
  );
}
