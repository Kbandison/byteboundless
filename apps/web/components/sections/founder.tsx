"use client";

// HIDDEN — Set SHOW_FOUNDER to true when ready to display
const SHOW_FOUNDER = false;

export function Founder() {
  if (!SHOW_FOUNDER) return null;

  return (
    <section className="relative py-24 md:py-32 bg-[var(--color-bg-secondary)]">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="flex flex-col md:flex-row items-start gap-8">
          {/* Photo placeholder — replace with real image */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] shrink-0 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-accent)] font-medium font-[family-name:var(--font-mono)] mb-3">
              Built by a developer, for developers
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold tracking-tight mb-4">
              {/* REPLACE: Your name */}
              Hey, I&apos;m [Your Name].
            </h2>
            <div className="space-y-4 text-[var(--color-text-secondary)] text-sm leading-relaxed">
              <p>
                {/* REPLACE: Your origin story — 2-3 sentences about why you built this */}
                I built ByteBoundless because I got tired of cold-emailing businesses
                that didn&apos;t actually need my help. I&apos;d spend hours Googling local
                businesses, squinting at their websites, guessing who might pay for a
                rebuild. Most of the time I was wrong.
              </p>
              <p>
                {/* REPLACE: What it does for you now */}
                Now I use ByteBoundless to find the businesses that genuinely need
                better websites — scored, ranked, with a pitch ready to send. It
                turned my cold outreach from a numbers game into a targeted strategy.
                I built it for myself, and now it&apos;s yours too.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-[var(--color-text-dim)]">
              {/* REPLACE: Your credentials */}
              <span>Navy Veteran</span>
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-dim)]" />
              <span>Freelance Web Developer</span>
              <span className="w-1 h-1 rounded-full bg-[var(--color-text-dim)]" />
              <span>Founder, LuxWeb Studio</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
