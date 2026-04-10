import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left panel — brand visual (hidden on mobile) */}
      <div className="hidden lg:flex relative flex-col items-center justify-center px-12 overflow-hidden bg-[#0066FF] dark:bg-[#3B82F6]">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.2)_0%,transparent_50%),radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(0,0,0,0.08)_50%,transparent_100%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          {/* Logo */}
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-white"
          >
            ByteBoundless
          </Link>

          {/* Tagline */}
          <p className="mt-4 text-lg text-white/80 font-[family-name:var(--font-display)] leading-relaxed">
            Find businesses that need better websites.
            <br />
            Turn cold leads into warm clients.
          </p>

          {/* Divider */}
          <div className="mt-10 mx-auto w-12 h-px bg-white/25" />

          {/* Testimonial-style quote */}
          <blockquote className="mt-10 text-white/70 text-sm leading-relaxed italic">
            &ldquo;I found 40 qualified leads in my first week. The AI pitch
            angles alone saved me hours of research.&rdquo;
          </blockquote>
          <p className="mt-3 text-white/50 text-xs font-medium uppercase tracking-wider">
            Freelance Web Developer
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <main className="flex items-center justify-center px-6 py-12 bg-[var(--color-bg-primary)]">
        {children}
      </main>
    </div>
  );
}
