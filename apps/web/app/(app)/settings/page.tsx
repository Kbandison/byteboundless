"use client";

import { useState, useEffect } from "react";
import {
  User,
  CreditCard,
  Bell,
  AlertTriangle,
  Loader2,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { SettingsSkeleton } from "@/components/ui/skeletons";
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

type Section = "profile" | "billing" | "notifications" | "danger";

const NAV_ITEMS: { key: Section; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("profile");
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userId, setUserId] = useState("");
  const [overageCredits, setOverageCredits] = useState(0);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [notifyOnComplete, setNotifyOnComplete] = useState(true);
  const [savingNotify, setSavingNotify] = useState(false);

  /* ── Read hash on mount & listen for changes ── */
  useEffect(() => {
    const readHash = () => {
      const hash = window.location.hash.replace("#", "") as Section;
      if (["profile", "billing", "notifications", "danger"].includes(hash)) {
        setActiveSection(hash);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  /* ── Fetch profile data ── */
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
        setNotifyOnComplete((p.notify_on_complete as boolean) ?? true);
      }
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleToggleNotify(next: boolean) {
    setSavingNotify(true);
    setNotifyOnComplete(next); // optimistic
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ notify_on_complete: next } as never)
      .eq("id", userId);
    setSavingNotify(false);
    if (error) {
      setNotifyOnComplete(!next); // revert
      toast.error("Failed to save preference");
    } else {
      toast.success(next ? "Notifications on" : "Notifications off");
    }
  }

  /* ── Handlers ── */
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
    toast.success("Profile saved");
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

  const navigateTo = (section: Section) => {
    setActiveSection(section);
    // Use history.replaceState instead of assigning to location.hash.
    // React Compiler flags the direct assignment as an immutability
    // violation; replaceState is a function call so it passes the rule
    // and behaves identically (updates URL without triggering navigation).
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${section}`);
    }
  };

  /* ── Loading state ── */
  if (loading) return <SettingsSkeleton />;

  /* ── Render ── */
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-8 py-12">
      {/* Page title — display font at 40px */}
      <h1 className="font-[family-name:var(--font-display)] text-[40px] font-bold tracking-tight text-[var(--color-text-primary)] mb-8">
        Settings
      </h1>

      {/* Split Navigation grid */}
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        {/* ── Left: Vertical Nav ── */}
        <nav className="flex flex-row md:flex-col gap-1 md:gap-0.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0 md:sticky md:top-24 md:self-start">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigateTo(key)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0 md:w-full md:text-left",
                activeSection === key
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-l-2 border-[var(--color-accent)] md:rounded-l-none"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 shrink-0",
                key === "danger" && activeSection === key && "text-red-500"
              )} />
              {label}
            </button>
          ))}

          {/* Sign out at bottom of nav */}
          <div className="hidden md:block mt-auto pt-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-all duration-150 w-full text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>
          </div>
        </nav>

        {/* ── Right: Section Content ── */}
        <div className="min-w-0">
          {/* ─── Profile Section ─── */}
          {activeSection === "profile" && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
                  Profile
                </h2>
                <p className="text-xs text-[var(--color-text-dim)]">
                  This info is used in AI-generated pitches
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
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

                {/* Company / Business Name */}
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

                {/* Phone */}
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

                {/* Website */}
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

                {/* Portfolio URL */}
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

                {/* Location */}
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

                {/* Years of Experience */}
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

                {/* Services */}
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-2">
                    Services
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          setServices((prev) =>
                            prev.includes(s)
                              ? prev.filter((x) => x !== s)
                              : [...prev, s]
                          )
                        }
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

                {/* Email (read-only) */}
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

              {/* Save & Sign Out actions */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[var(--color-border)]">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Profile"
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="md:hidden text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] px-4 py-2.5 rounded-lg hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </section>
          )}

          {/* ─── Billing Section ─── */}
          {activeSection === "billing" && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                Billing
              </h2>

              {/* Usage stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-center">
                  <p className="text-3xl font-bold font-[family-name:var(--font-mono)] text-[var(--color-text-primary)]">
                    {searchesUsed}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)] mt-1">
                    Searches used
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-center">
                  <p className="text-3xl font-bold font-[family-name:var(--font-mono)] text-[var(--color-text-primary)]">
                    {searchesLimit === 999999 ? "\u221E" : searchesLimit - searchesUsed}
                  </p>
                  <p className="text-xs text-[var(--color-text-dim)] mt-1">
                    Remaining
                  </p>
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
                        <span className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-secondary)]">
                          {p.price}
                        </span>
                        {plan === p.key && (
                          <span className="text-[10px] uppercase tracking-wider font-medium bg-[var(--color-accent)] text-white px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {p.description}
                      </p>
                    </div>
                    {plan !== p.key && (
                      <PlanChangeButton
                        targetPlan={p.key as "free" | "pro" | "agency"}
                        currentPlan={plan as "free" | "pro" | "agency"}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Overage credits */}
              {(plan === "pro" || plan === "agency") && (
                <div className="mt-6 p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">Extra Result Credits</p>
                      <p className="text-xs text-[var(--color-text-dim)]">
                        {overageCredits > 0
                          ? `${overageCredits} extra results available`
                          : "No extra credits \u2014 purchase when you need more"}
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
                        const res = await fetch("/api/billing/checkout", {
                          method: "POST",
                        });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          toast.error(data.error || "Failed to start checkout");
                        }
                      } catch {
                        toast.error("Network error");
                      }
                      setBuyingCredits(false);
                    }}
                    disabled={buyingCredits}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-accent)] text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 disabled:opacity-50 transition-all"
                  >
                    {buyingCredits
                      ? "Redirecting to checkout..."
                      : "Buy 200 Extra Results \u2014 $4"}
                  </button>
                </div>
              )}

              {/* Manage subscription via Stripe Billing Portal */}
              {(plan === "pro" || plan === "agency") && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">
                    Manage Subscription
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                    Update payment methods, download invoices, change plans, or cancel your subscription.
                  </p>
                  <ManageBillingButton />
                </div>
              )}

              <p className="text-xs text-[var(--color-text-dim)] mt-4">
                Billing is managed through Stripe.
              </p>
            </section>
          )}

          {/* ─── Notifications Section ─── */}
          {activeSection === "notifications" && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                Notifications
              </h2>

              <div className="flex items-start justify-between gap-6 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Email me when searches complete
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                    Get a summary email with the result count and hot lead count when a long-running search finishes. Useful if you start a search and close the tab.
                  </p>
                </div>
                <button
                  onClick={() => handleToggleNotify(!notifyOnComplete)}
                  disabled={savingNotify}
                  role="switch"
                  aria-checked={notifyOnComplete}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 disabled:opacity-50",
                    notifyOnComplete
                      ? "bg-[var(--color-accent)]"
                      : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      notifyOnComplete ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              <p className="text-xs text-[var(--color-text-dim)] mt-4">
                You&apos;ll still see the in-app progress indicator regardless of this setting.
              </p>
            </section>
          )}

          {/* ─── Danger Zone Section ─── */}
          {activeSection === "danger" && (
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-red-600 mb-2">
                Danger Zone
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>

              <div className="p-6 rounded-lg border border-red-200 bg-red-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-medium text-red-700">
                    Delete your account
                  </p>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Once you delete your account, all of your data, saved searches,
                  and generated pitches will be permanently removed. There is no
                  way to recover your account after this action.
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
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan change button (handles upgrade / downgrade / cancel) ───
function PlanChangeButton({
  targetPlan,
  currentPlan,
}: {
  targetPlan: "free" | "pro" | "agency";
  currentPlan: "free" | "pro" | "agency";
}) {
  const [loading, setLoading] = useState(false);
  const tierOrder = { free: 0, pro: 1, agency: 2 } as const;
  const isUpgrade = tierOrder[targetPlan] > tierOrder[currentPlan];

  async function handleClick() {
    setLoading(true);
    try {
      // Downgrade / cancel: route through the Stripe Billing Portal so the
      // user gets Stripe's hosted UI for cancellation (with retention prompts,
      // cancel_at_period_end handling, etc.). Portal changes come back via
      // webhook events the /api/billing/webhook handler already processes.
      if (!isUpgrade) {
        const res = await fetch("/api/billing/portal", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to open billing portal");
          return;
        }
        if (data.url) window.location.href = data.url;
        return;
      }

      // Upgrade: create a subscription checkout session
      if (targetPlan === "free") return; // shouldn't happen — free isn't an upgrade

      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-[var(--color-accent)] font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : isUpgrade ? (
        "Upgrade"
      ) : (
        "Downgrade"
      )}
      {!loading && <ArrowRight className="w-3 h-3" />}
    </button>
  );
}

// ─── Manage billing button — opens the Stripe Customer Portal ───
// Used from the billing section for paid-plan users. The portal handles
// cancellation, payment method updates, invoices, and plan changes.
function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to open billing portal");
        return;
      }
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          Manage Billing
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}
