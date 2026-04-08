import { Navbar } from "@/components/layout/navbar";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-6 pt-16 pb-12 bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </>
  );
}
