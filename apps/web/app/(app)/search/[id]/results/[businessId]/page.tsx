"use client";

import { useState } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  Globe,
  Phone,
  MapPin,
  Star,
  Mail,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  Copy,
  RefreshCw,
  Sparkles,
  Shield,
  Smartphone,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getScoreColor, TECH_STACK_COLORS } from "@/lib/constants";

// Mock data for the lead detail
const MOCK_LEAD = {
  id: "1",
  name: "Sunrise Dental Care",
  category: "Dentist",
  website: "sunrisedental.com",
  phone: "(512) 555-0142",
  address: "123 Main St, Austin, TX 78701",
  rating: 3.8,
  reviews: 24,
  unclaimed: false,
  score: 92,
  techStack: [{ platform: "godaddy", label: "GoDaddy", confidence: 95 }],
  emails: [
    { address: "info@sunrisedental.com", category: "business" },
    { address: "admin@sunrisedental.com", category: "developer" },
  ],
  socials: [{ platform: "Facebook", url: "facebook.com/sunrisedental" }],
  hasMobileViewport: false,
  hasSSL: true,
  lastModified: "2019-03-15",
  leadReasons: [
    { signal: "Outdated platform", detail: "Running GoDaddy Website Builder — limited, dated technology", weight: 25 },
    { signal: "No mobile viewport", detail: "Site lacks mobile responsiveness — alienates 60%+ of visitors", weight: 20 },
    { signal: "Low review count", detail: "Only 24 reviews suggests limited online presence", weight: 15 },
    { signal: "Stale content", detail: "Last modified March 2019 — over 5 years without updates", weight: 20 },
    { signal: "Missing socials", detail: "Only 1 social profile found — missed marketing channels", weight: 12 },
  ],
};

const MOCK_PITCH = {
  pitchAngle:
    "Sunrise Dental Care is running a GoDaddy-built website from 2019 that isn't mobile-responsive — meaning over half their potential patients are seeing a broken experience. With only 24 Google reviews despite being established, they're clearly underinvesting in their digital presence. A modern, fast, mobile-first site with proper SEO could significantly increase their new patient acquisition.",
  suggestions: [
    "Replace the GoDaddy site with a modern, mobile-first build. Their current site has no mobile viewport — patients on phones see a desktop layout crammed into a tiny screen.",
    "Add an online booking widget. Dental practices that offer online scheduling see 30% more appointment requests than those requiring phone calls.",
    "Implement local SEO optimizations. With only 24 reviews and limited social presence, they're invisible to patients searching 'dentist near me' in Austin.",
  ],
  draftEmail: `Hi there,

I came across Sunrise Dental Care while researching dental practices in Austin, and I noticed your website might be holding back your practice.

Specifically, your site isn't mobile-friendly — which means over 60% of potential patients who find you on their phones are getting a frustrating experience. Your site is also built on GoDaddy's older platform and hasn't been updated since 2019.

I build fast, modern websites specifically for dental practices. I'd love to show you what a refreshed online presence could look like — one that actually books appointments from Google searches.

Would you be open to a 10-minute call this week?

Best,
[Your Name]`,
};

function ScoreBadgeLarge({ score }: { score: number }) {
  const colors = getScoreColor(score);
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold font-[family-name:var(--font-mono)] border-2",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      {score}
    </div>
  );
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string; businessId: string }>;
}) {
  const { id, businessId } = use(params);
  const [copied, setCopied] = useState(false);
  const [pitchLoaded, setPitchLoaded] = useState(true);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lead = MOCK_LEAD;
  const pitch = MOCK_PITCH;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      {/* Back link */}
      <Link
        href={`/search/${id}/results`}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to results
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left — Business Data */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header card */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
                  {lead.name}
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {lead.category}
                </p>
              </div>
              <button className="p-2 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300">
                <Bookmark className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {lead.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                  <a
                    href={`https://${lead.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    {lead.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                <span className="text-[var(--color-text-secondary)]">
                  {lead.address}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  {lead.rating}{" "}
                  <span className="text-[var(--color-text-dim)]">
                    ({lead.reviews} reviews)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Tech stack */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">
              Tech Stack
            </h3>
            {lead.techStack.map((tech) => {
              const colors =
                TECH_STACK_COLORS[tech.platform] || TECH_STACK_COLORS.unknown;
              return (
                <div key={tech.platform} className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-sm px-3 py-1 rounded-md font-medium",
                      colors.bg,
                      colors.text
                    )}
                  >
                    {tech.label}
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)] font-[family-name:var(--font-mono)]">
                    {tech.confidence}% confidence
                  </span>
                </div>
              );
            })}
          </div>

          {/* Enrichment signals */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">
              Enrichment Signals
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[var(--color-text-dim)]" />
                  <span>Mobile Viewport</span>
                </div>
                <span className={lead.hasMobileViewport ? "text-emerald-600" : "text-red-500"}>
                  {lead.hasMobileViewport ? "Yes" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--color-text-dim)]" />
                  <span>SSL Certificate</span>
                </div>
                <span className={lead.hasSSL ? "text-emerald-600" : "text-red-500"}>
                  {lead.hasSSL ? "Valid" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--color-text-dim)]" />
                  <span>Last Modified</span>
                </div>
                <span className="text-[var(--color-text-secondary)] font-[family-name:var(--font-mono)] text-xs">
                  {lead.lastModified}
                </span>
              </div>
            </div>
          </div>

          {/* Emails */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">
              Emails Found
            </h3>
            <div className="space-y-2">
              {lead.emails.map((email, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-[var(--color-text-dim)]" />
                    <span className="font-[family-name:var(--font-mono)] text-xs">
                      {email.address}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                    {email.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300">
              <Bookmark className="w-4 h-4" />
              Save to List
            </button>
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:border-emerald-500 hover:text-emerald-600 transition-all duration-300">
              <CheckCircle2 className="w-4 h-4" />
              Mark Contacted
            </button>
          </div>
        </div>

        {/* Right — AI Pitch Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Score */}
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
            <div className="flex items-start gap-5">
              <ScoreBadgeLarge score={lead.score} />
              <div className="flex-1">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-3">
                  Lead Score Breakdown
                </h2>
                <div className="space-y-2">
                  {lead.leadReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] font-semibold mt-0.5 w-6 shrink-0">
                        +{reason.weight}
                      </span>
                      <div>
                        <span className="text-sm font-medium">
                          {reason.signal}
                        </span>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {reason.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Pitch */}
          <div className="p-6 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/[0.02]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                  AI Pitch
                </h2>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>

            {/* Pitch angle */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">
                Pitch Angle
              </h3>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {pitch.pitchAngle}
              </p>
            </div>

            {/* Improvement suggestions */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
                Specific Improvements
              </h3>
              <div className="space-y-3">
                {pitch.suggestions.map((suggestion, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] font-semibold mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Draft email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium">
                  Draft Outreach Email
                </h3>
                <button
                  onClick={() => handleCopy(pitch.draftEmail)}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap break-words font-[family-name:var(--font-body)] leading-relaxed">
                  {pitch.draftEmail}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
