"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft, Globe, Phone, MapPin, Star, Mail, ExternalLink,
  Bookmark, CheckCircle2, Copy, RefreshCw, Sparkles, Shield,
  Smartphone, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HelpTip } from "@/components/ui/help-tip";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { usePlan, isPaidPlan } from "@/hooks/use-plan";
import { getScoreColor, TECH_STACK_COLORS } from "@/lib/constants";
import { LeadDetailSkeleton } from "@/components/ui/skeletons";
import { createClient } from "@/lib/supabase/client";

interface LeadData {
  id: string;
  name: string;
  category: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  unclaimed: boolean;
  score: number;
  leadReasons: { signal: string; weight: number; detail: string }[];
  enrichment: Record<string, unknown> | null;
}

interface PitchData {
  pitch_angle?: string;
  pitchAngle?: string;
  improvement_suggestions?: string[];
  improvementSuggestions?: string[];
  draft_email?: string;
  draftEmail?: string;
}

function ScoreBadgeLarge({ score }: { score: number }) {
  const colors = getScoreColor(score);
  return (
    <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold font-[family-name:var(--font-mono)] border-2", colors.bg, colors.text, colors.border)}>
      {score}
    </div>
  );
}

function parseLead(raw: Record<string, unknown>): LeadData {
  const reasons = (raw.lead_reasons as unknown[]) ?? [];
  return {
    id: raw.id as string,
    name: raw.name as string,
    category: raw.category as string | null,
    website: raw.website as string | null,
    phone: raw.phone as string | null,
    address: raw.address as string | null,
    rating: raw.rating as number | null,
    reviews: raw.reviews as number | null,
    unclaimed: raw.unclaimed as boolean,
    score: raw.lead_score as number,
    leadReasons: reasons.map((r) => {
      if (typeof r === "string") return { signal: r, weight: 0, detail: r };
      const obj = r as Record<string, unknown>;
      return { signal: (obj.signal as string) ?? String(r), weight: (obj.weight as number) ?? 0, detail: (obj.detail as string) ?? String(r) };
    }),
    enrichment: raw.enrichment as Record<string, unknown> | null,
  };
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string; businessId: string }> }) {
  const { id, businessId } = use(params);
  const plan = usePlan();
  const paid = isPaidPlan(plan);
  const [lead, setLead] = useState<LeadData | null>(null);
  const [pitch, setPitch] = useState<PitchData | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [outcomeStatus, setOutcomeStatus] = useState<string | null>(null);
  const [dealAmount, setDealAmount] = useState("");
  const [showDealInput, setShowDealInput] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);

  // Fetch business data
  useEffect(() => {
    async function fetch_data() {
      const supabase = createClient();
      const { data } = await supabase.from("businesses").select("*").eq("id", businessId).single();
      if (data) setLead(parseLead(data as Record<string, unknown>));
      setLoading(false);

      // Check outcome state
      const res = await fetch(`/api/contacted?businessId=${businessId}`);
      const outcome = await res.json();
      if (outcome.status) setOutcomeStatus(outcome.status);
    }
    fetch_data();
  }, [businessId]);

  // Fetch or generate pitch
  const fetchPitch = useCallback(async (regenerate = false) => {
    setPitchLoading(true);
    setPitchError(null);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, regenerate }),
      });
      const data = await res.json();
      if (!res.ok) { setPitchError(data.error); return; }
      setPitch(data.pitch);
    } catch { setPitchError("Failed to generate pitch"); }
    finally { setPitchLoading(false); }
  }, [businessId]);

  useEffect(() => { if (lead) fetchPitch(); }, [lead, fetchPitch]);

  // Fetch user's saved lists for the dropdown
  useEffect(() => {
    fetch("/api/lists").then((r) => r.json()).then((d) => {
      if (d.lists) setLists((d.lists as { id: string; name: string }[]));
    });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) return <LeadDetailSkeleton />;

  if (!lead) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-20 text-center">
        <p className="text-[var(--color-text-secondary)]">Business not found.</p>
        <Link href={`/search/${id}/results`} className="text-sm text-[var(--color-accent)] mt-4 inline-block">Back to results</Link>
      </div>
    );
  }

  const e = lead.enrichment;
  const techStack = (e?.techStack as string[]) ?? [];
  const emails = (e?.emails as string[]) ?? [];
  const devEmails = (e?.developerContacts as string[]) ?? [];
  const socials = (e?.socials as Record<string, string>) ?? {};
  const hasViewport = e?.hasViewport as boolean | null;
  const copyrightYear = e?.copyrightYear as number | null;
  const lighthouse = e?.lighthouse as { performance: number; seo: number; accessibility: number } | null;
  const pitchAngle = pitch?.pitch_angle ?? pitch?.pitchAngle ?? "";
  const suggestions = pitch?.improvement_suggestions ?? pitch?.improvementSuggestions ?? [];
  const draftEmail = pitch?.draft_email ?? pitch?.draftEmail ?? "";

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
      <Link href={`/search/${id}/results`} className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left — Business Data */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]">
            <div className="mb-4">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">{lead.name}</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">{lead.category}</p>
            </div>
            <div className="space-y-3">
              {lead.website && (
                <div className="flex items-center gap-3 text-sm min-w-0">
                  <Globe className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                  <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline flex items-center gap-1 min-w-0">
                    <span className="truncate">{lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-[var(--color-text-dim)] shrink-0" />
                  <span className="text-[var(--color-text-secondary)]">{lead.address}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>{lead.rating ?? "N/A"} <span className="text-[var(--color-text-dim)]">({lead.reviews ?? 0} reviews)</span></span>
              </div>
            </div>
          </div>

          {/* Tech stack */}
          {techStack.length > 0 && (
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => {
                  const key = tech.toLowerCase().replace("godaddybuilder", "godaddy");
                  const colors = TECH_STACK_COLORS[key] || TECH_STACK_COLORS.unknown;
                  return (
                    <span key={tech} className={cn("text-sm px-3 py-1 rounded-md font-medium", colors.bg, colors.text)}>{tech}</span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Enrichment signals */}
          {e && (
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">Enrichment Signals</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-[var(--color-text-dim)]" /><span>Mobile Viewport</span></div>
                  <span className={hasViewport ? "text-emerald-600" : "text-red-500"}>{hasViewport ? "Yes" : "Missing"}</span>
                </div>
                {copyrightYear && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--color-text-dim)]" /><span>Copyright Year</span></div>
                    <span className="text-[var(--color-text-secondary)] font-[family-name:var(--font-mono)] text-xs">{copyrightYear}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-[var(--color-text-dim)]" /><span>Reachable</span></div>
                  <span className={e.reachable ? "text-emerald-600" : "text-red-500"}>{e.reachable ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Lighthouse Scores */}
          {lighthouse ? (
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4 flex items-center gap-2">
                Lighthouse Scores
                <HelpTip text="Google's automated audit of the site's performance, SEO, and accessibility. Lower scores = more pitch ammunition for why they need a rebuild." />
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Performance", value: lighthouse.performance },
                  { label: "SEO", value: lighthouse.seo },
                  { label: "Accessibility", value: lighthouse.accessibility },
                ].map((metric) => (
                  <div key={metric.label} className="text-center p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                    <p className={cn(
                      "text-xl font-bold font-[family-name:var(--font-mono)]",
                      metric.value >= 90 ? "text-emerald-600" :
                      metric.value >= 50 ? "text-amber-600" : "text-red-500"
                    )}>
                      {metric.value}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-dim)] mt-0.5">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : e?.reachable && lead.website ? (
            <div className="p-5 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2 flex items-center gap-2">
                Lighthouse Scores
                <HelpTip text="Google's automated audit of the site's performance, SEO, and accessibility." />
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Audit timed out for this site — likely due to slow page load or server issues. This itself is a signal: if Google can&apos;t audit it quickly, visitors are probably having a poor experience too.
              </p>
            </div>
          ) : null}

          {/* Emails */}
          {(emails.length > 0 || devEmails.length > 0) && (
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">Emails Found</h3>
              <div className="space-y-2">
                {emails.map((email, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-[var(--color-text-dim)]" /><span className="font-[family-name:var(--font-mono)] text-xs">{email}</span></div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">business</span>
                  </div>
                ))}
                {devEmails.map((email, i) => (
                  <div key={`dev-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-[var(--color-text-dim)]" /><span className="font-[family-name:var(--font-mono)] text-xs">{email}</span></div>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">developer</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Socials */}
          {Object.keys(socials).length > 0 && (
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-4">Social Profiles</h3>
              <div className="space-y-2">
                {Object.entries(socials).map(([platform, url]) => (
                  <a key={platform} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline capitalize">
                    {platform} <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions — gated for free users */}
          {paid ? (
          <div className="space-y-3">
            <div className="relative">
              <button
                onClick={() => setShowListDropdown(!showListDropdown)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[var(--color-border)] text-sm font-medium hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all duration-300"
              >
                <Bookmark className="w-4 h-4" /> Save to List
              </button>
              {showListDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 overflow-hidden">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      onClick={async () => {
                        const res = await fetch("/api/lists/items", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ listId: list.id, businessId }),
                        });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success(`Saved to "${list.name}"`);
                        } else {
                          toast.error(data.error || "Error saving");
                        }
                        setShowListDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      {list.name}
                    </button>
                  ))}
                  <div className="border-t border-[var(--color-border)] px-3 py-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="New list name..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newListName.trim()) {
                            e.preventDefault();
                            (async () => {
                              setCreatingList(true);
                              const res = await fetch("/api/lists", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: newListName.trim() }),
                              });
                              const data = await res.json();
                              if (data.list) {
                                const newList = data.list as { id: string; name: string };
                                setLists((prev) => [...prev, newList]);
                                // Auto-save to the new list
                                await fetch("/api/lists/items", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ listId: newList.id, businessId }),
                                });
                                toast.success(`Created "${newList.name}" and saved`);
                                setShowListDropdown(false);
                                setNewListName("");
                              }
                              setCreatingList(false);
                            })();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                      />
                      <button
                        disabled={creatingList || !newListName.trim()}
                        onClick={async () => {
                          setCreatingList(true);
                          const res = await fetch("/api/lists", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newListName.trim() }),
                          });
                          const data = await res.json();
                          if (data.list) {
                            const newList = data.list as { id: string; name: string };
                            setLists((prev) => [...prev, newList]);
                            await fetch("/api/lists/items", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ listId: newList.id, businessId }),
                            });
                            toast.success(`Created "${newList.name}" and saved`);
                            setShowListDropdown(false);
                            setNewListName("");
                          }
                          setCreatingList(false);
                        }}
                        className="px-2.5 py-1.5 text-xs bg-[var(--color-accent)] text-white rounded disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Outcome Pipeline */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">Outreach Status</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "contacted", label: "Contacted", color: "blue" },
                  { key: "replied", label: "Replied", color: "violet" },
                  { key: "quoted", label: "Quoted", color: "amber" },
                  { key: "signed", label: "Signed", color: "emerald" },
                  { key: "lost", label: "Lost", color: "red" },
                ].map((step) => {
                  const order = ["contacted", "replied", "quoted", "signed", "lost"];
                  const currentIdx = outcomeStatus ? order.indexOf(outcomeStatus) : -1;
                  const stepIdx = order.indexOf(step.key);
                  const isActive = outcomeStatus === step.key;
                  const isPast = currentIdx >= 0 && stepIdx < currentIdx && step.key !== "lost";
                  const colorMap: Record<string, string> = {
                    blue: isActive ? "border-blue-500 bg-blue-50 text-blue-700" : "",
                    violet: isActive ? "border-violet-500 bg-violet-50 text-violet-700" : "",
                    amber: isActive ? "border-amber-500 bg-amber-50 text-amber-700" : "",
                    emerald: isActive ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "",
                    red: isActive ? "border-red-500 bg-red-50 text-red-700" : "",
                  };
                  return (
                    <button
                      key={step.key}
                      onClick={async () => {
                        if (step.key === "signed") {
                          setShowDealInput(true);
                          setOutcomeStatus("signed");
                          await fetch("/api/contacted", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ businessId, status: "signed" }),
                          });
                          return;
                        }
                        setOutcomeStatus(step.key);
                        setShowDealInput(false);
                        await fetch("/api/contacted", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ businessId, status: step.key }),
                        });
                      }}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200",
                        isActive ? colorMap[step.color] :
                        isPast ? "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-dim)] line-through" :
                        "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                      )}
                    >
                      {isActive && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {step.label}
                    </button>
                  );
                })}
              </div>
              {showDealInput && outcomeStatus === "signed" && (
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    value={dealAmount}
                    onChange={(e) => setDealAmount(e.target.value)}
                    placeholder="Deal amount ($)"
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                  />
                  <button
                    onClick={async () => {
                      await fetch("/api/contacted", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ businessId, status: "signed", dealAmount: parseFloat(dealAmount) }),
                      });
                      setShowDealInput(false);
                    }}
                    className="px-3 py-2 text-xs bg-emerald-600 text-white rounded-lg font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
          ) : (
            <UpgradeGate feature="Save to lists, track outreach, and manage your pipeline" />
          )}
        </div>

        {/* Right — Score + AI Pitch */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] shadow-[0_4px_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_-12px_rgba(0,0,0,0.4)]">
            <div className="flex items-start gap-5">
              <ScoreBadgeLarge score={lead.score} />
              <div className="flex-1">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold mb-3 flex items-center gap-2">Lead Score Breakdown <HelpTip text="Score from 0-100 based on 12+ signals: tech stack age, mobile-friendliness, page speed, social presence, review count, and more. Higher = more likely to need your services." /></h2>
                <div className="space-y-2">
                  {lead.leadReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] font-semibold mt-0.5 w-6 shrink-0">+{reason.weight}</span>
                      <div>
                        <span className="text-sm font-medium">{reason.signal}</span>
                        {reason.detail !== reason.signal && <p className="text-xs text-[var(--color-text-secondary)]">{reason.detail}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Pitch — premium card */}
          <div className="p-6 rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-2)] shadow-[0_8px_32px_-12px_var(--color-accent-3)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
                <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">AI Pitch</h2>
              </div>
              <button onClick={() => fetchPitch(true)} disabled={pitchLoading} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50">
                <RefreshCw className={cn("w-3.5 h-3.5", pitchLoading && "animate-spin")} /> Regenerate
              </button>
            </div>

            {pitchLoading && !pitch && (
              <div className="py-12 flex flex-col items-center">
                <Loader2 className="w-6 h-6 text-[var(--color-accent)] animate-spin mb-3" />
                <p className="text-sm text-[var(--color-text-secondary)]">Generating pitch with AI...</p>
              </div>
            )}

            {pitchError && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-4">{pitchError}</div>
            )}

            {pitch && (
              <>
                <div className="mb-6">
                  <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-2">Pitch Angle</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{pitchAngle}</p>
                </div>

                {suggestions.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium mb-3">Specific Improvements</h3>
                    <div className="space-y-3">
                      {suggestions.map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="text-xs font-[family-name:var(--font-mono)] text-[var(--color-accent)] font-semibold mt-0.5 shrink-0">{i + 1}.</span>
                          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {draftEmail && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] font-medium">Draft Outreach Email</h3>
                      <button onClick={() => handleCopy(draftEmail)} className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors">
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                      <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap break-words font-[family-name:var(--font-body)] leading-relaxed">{draftEmail}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
