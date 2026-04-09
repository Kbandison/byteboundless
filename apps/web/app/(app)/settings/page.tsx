"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, CreditCard, AlertTriangle, Loader2, Check, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { cn } from "@/lib/utils";

const SERVICE_OPTIONS = [
  "Web Design", "Web Development", "E-Commerce", "SEO", "Landing Pages",
  "WordPress", "Shopify", "Website Redesign", "Website Maintenance",
  "Branding", "UI/UX Design", "Mobile-Responsive Design", "Custom Web Apps",
  "Email Marketing", "Social Media",
];

const PLANS = [
  {
    key: "free",
    name: "Free Trial",
    price: "$0",
    description: "3 searches/mo, 50 results, 10 AI pitches",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29/mo",
    description: "50 searches/mo, 500 results, 200 AI pitches",
  },
  {
    key: "agency",
    name: "Agency",
    price: "$79/mo",
    description: "200 searches/mo, 1K results, unlimited AI pitches",
  },
];

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [plan, setPlan] = useState("free");
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userId, setUserId] = useState("");
  const [overageCredits, setOverageCredits] = useState(0);
  const [buyingCredits, setBuyingCredits] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        const p = data as Record<string, unknown>;
        setPlan(p.plan as string);
        setSearchesUsed(p.searches_used as number);
        setSearchesLimit(p.searches_limit as number);
        setFullName((p.full_name as string) ?? "");
        setPhone((p.phone as string) ?? "");
        setWebsite((p.website as string) ?? "");
        setCompanyName((p.company_name as string) ?? "");
        setLocation((p.location as string) ?? "");
        setServices((p.services as string[]) ?? []);
        setYearsExperience(p.years_experience ? String(p.years_experience) : "");
        setPortfolioUrl((p.portfolio_url as string) ?? "");
        setOverageCredits((p.overage_credits as number) ?? 0);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        phone: phone || null,
        website: website || null,
        company_name: companyName || null,
        location: location || null,
        services: services.length > 0 ? services : [],
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        portfolio_url: portfolioUrl || null,
      } as never)
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("profiles").delete().eq("id", userId);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-8 py-20 flex flex-col items-center">
        <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight mb-8">
        Settings
      </h1>

      <div className="space-y-8">
        {/* Profile */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-[var(--color-text-dim)]" />
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
                Profile
              </h2>
            </div>
            <p className="text-xs text-[var(--color-text-dim)]">
              This info is used in AI-generated pitches
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Company / Business Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Smith Web Design"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://smithwebdesign.com"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Portfolio URL
              </label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://portfolio.example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Location
              </label>
              <AutocompleteInput
                value={location}
                onChange={setLocation}
                apiEndpoint="/api/cities"
                placeholder="Atlanta, GA"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Years of Experience
              </label>
              <select
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="1">Less than 1 year</option>
                <option value="2">1-2 years</option>
                <option value="3">3-5 years</option>
                <option value="7">5-10 years</option>
                <option value="10">10+ years</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-2">
                Services
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-lg border transition-all duration-200",
                      services.includes(s)
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text-secondary)]"
              />
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Managed through magic link authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <><Check className="w-4 h-4" /> Saved</>
              ) : (
                "Save Profile"
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] px-4 py-2.5 rounded-lg hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </section>

        {/* Billing */}
        <section className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-[var(--color-text-dim)]" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
              Billing
            </h2>
          </div>

          {/* Usage stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                {searchesUsed}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">Searches used</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] text-center">
              <p className="text-2xl font-bold font-[family-name:var(--font-mono)]">
                {searchesLimit === 999999 ? "∞" : searchesLimit - searchesUsed}
              </p>
              <p className="text-xs text-[var(--color-text-dim)] mt-1">Remaining</p>
            </div>
          </div>

          {/* Plan selector */}
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
            Current Plan
          </p>
          <div className="space-y-3">
            {PLANS.map((p) => (
              <div
                key={p.key}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all",
                  plan === p.key
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/5"
                    : "border-[var(--color-border)]"
                )}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">{p.price}</span>
                    {plan === p.key && (
                      <span className="text-[10px] uppercase tracking-wider font-medium bg-[var(--color-accent)] text-white px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{p.description}</p>
                </div>
                {plan !== p.key && (
                  <Link
                    href="/pricing"
                    className="text-xs text-[var(--color-accent)] font-medium hover:underline flex items-center gap-1"
                  >
                    {PLANS.findIndex((x) => x.key === p.key) > PLANS.findIndex((x) => x.key === plan) ? "Upgrade" : "Downgrade"}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>
          {/* Overage credits */}
          {(plan === "pro" || plan === "agency") && (
            <div className="mt-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">Extra Result Credits</p>
                  <p className="text-xs text-[var(--color-text-dim)]">
                    {overageCredits > 0
                      ? `${overageCredits} extra results available`
                      : "No extra credits — purchase when you need more"}
                  </p>
                </div>
                <span className="text-xl font-bold font-[family-name:var(--font-mono)]">
                  {overageCredits}
                </span>
              </div>
              <button
                onClick={async () => {
                  setBuyingCredits(true);
                  try {
                    const res = await fetch("/api/billing/checkout", { method: "POST" });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert(data.error || "Failed to start checkout");
                    }
                  } catch {
                    alert("Network error");
                  }
                  setBuyingCredits(false);
                }}
                disabled={buyingCredits}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-accent)] text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 disabled:opacity-50 transition-all"
              >
                {buyingCredits ? "Redirecting to checkout..." : "Buy 200 Extra Results — $4"}
              </button>
            </div>
          )}

          <p className="text-xs text-[var(--color-text-dim)] mt-4">
            Billing is managed through Stripe.
          </p>
        </section>

        {/* Danger Zone */}
        <section className="p-6 rounded-xl border border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-red-700">
              Danger Zone
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-[var(--color-text-secondary)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
