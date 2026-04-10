"use client";

import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { cn } from "@/lib/utils";

const SERVICE_OPTIONS = [
  "Web Design",
  "Web Development",
  "E-Commerce",
  "SEO",
  "Landing Pages",
  "WordPress",
  "Shopify",
  "Website Redesign",
  "Website Maintenance",
  "Branding",
  "UI/UX Design",
  "Mobile-Responsive Design",
  "Custom Web Apps",
  "Email Marketing",
  "Social Media",
];

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  // Step 1: Basics
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Step 2: Contact
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [location, setLocation] = useState("");

  // Step 3: Expertise
  const [services, setServices] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState<string>("");

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    getUser();
  }, []);

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName || null,
        company_name: companyName || null,
        phone: phone || null,
        website: website || null,
        portfolio_url: portfolioUrl || null,
        location: location || null,
        services: services.length > 0 ? services : [],
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
        onboarding_complete: true,
      } as never)
      .eq("id", userId);

    if (error) {
      console.error("Setup save error:", error);
      // Try simpler update if columns don't exist yet
      await supabase
        .from("profiles")
        .update({ onboarding_complete: true } as never)
        .eq("id", userId);
    }
    window.location.href = "/dashboard";
  };

  const handleSkip = async () => {
    if (!userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ onboarding_complete: true } as never)
      .eq("id", userId);
    window.location.href = "/dashboard";
  };

  const totalSteps = 3;
  const canProceed =
    step === 1 ? fullName.trim().length > 0 :
    step === 2 ? true :
    true;

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Step {step} of {totalSteps}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            {step === 1 && "Welcome to ByteBoundless"}
            {step === 2 && "How can leads reach you?"}
            {step === 3 && "What do you offer?"}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            {step === 1 && "Let's personalize your AI-generated pitches."}
            {step === 2 && "This info goes into your outreach emails."}
            {step === 3 && "Helps us tailor pitch suggestions to your services."}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < step ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
              )}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Smith"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
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
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  autoFocus
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
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
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
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
                  placeholder="https://portfolio.smithwebdesign.com"
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                  Your Location
                </label>
                <AutocompleteInput
                  value={location}
                  onChange={setLocation}
                  apiEndpoint="/api/cities"
                  placeholder="Atlanta, GA"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-2">
                  Services You Offer
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_OPTIONS.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() =>
                        setServices((prev) =>
                          prev.includes(service)
                            ? prev.filter((s) => s !== service)
                            : [...prev, service]
                        )
                      }
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-lg border transition-all duration-200",
                        services.includes(service)
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                      )}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium block mb-1.5">
                  Years of Experience
                </label>
                <select
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="1">Less than 1 year</option>
                  <option value="2">1-2 years</option>
                  <option value="3">3-5 years</option>
                  <option value="7">5-10 years</option>
                  <option value="10">10+ years</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                onClick={handleSkip}
                disabled={saving}
                className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
          <div>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed}
                className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Check className="w-4 h-4" /> Finish Setup</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
