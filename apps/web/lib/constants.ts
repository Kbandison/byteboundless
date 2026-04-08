export const SITE = {
  name: "ByteBoundless",
  title: "ByteBoundless — Find Businesses That Need Better Websites",
  description:
    "Lead intelligence for freelance web developers. Scrape Google Maps, score businesses by rebuild opportunity, and generate AI-powered pitch angles — all in one tool.",
  url: "https://byteboundless.com",
} as const;

export const NAV_LINKS = [
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
] as const;

export const APP_NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Saved Lists", href: "/lists", icon: "Bookmark" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const FOOTER_LINKS = {
  product: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Pricing", href: "/pricing" },
    { label: "Log In", href: "/login" },
    { label: "Sign Up", href: "/signup" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
} as const;

export const TECH_STACK_COLORS: Record<string, { bg: string; text: string }> = {
  wix: { bg: "bg-yellow-500/15", text: "text-yellow-700" },
  squarespace: { bg: "bg-neutral-800/15", text: "text-neutral-800" },
  wordpress: { bg: "bg-blue-600/15", text: "text-blue-700" },
  godaddy: { bg: "bg-orange-500/15", text: "text-orange-700" },
  weebly: { bg: "bg-orange-400/15", text: "text-orange-600" },
  duda: { bg: "bg-violet-500/15", text: "text-violet-700" },
  webflow: { bg: "bg-blue-500/15", text: "text-blue-600" },
  shopify: { bg: "bg-green-600/15", text: "text-green-700" },
  nextjs: { bg: "bg-neutral-900/15", text: "text-neutral-900" },
  react: { bg: "bg-cyan-500/15", text: "text-cyan-700" },
  unknown: { bg: "bg-neutral-400/15", text: "text-neutral-500" },
} as const;

export const SCORE_COLORS = {
  hot: { bg: "bg-emerald-500/15", text: "text-emerald-700", border: "border-emerald-500/30" },
  warm: { bg: "bg-amber-500/15", text: "text-amber-700", border: "border-amber-500/30" },
  cold: { bg: "bg-neutral-400/15", text: "text-neutral-500", border: "border-neutral-400/30" },
} as const;

export function getScoreColor(score: number) {
  if (score >= 80) return SCORE_COLORS.hot;
  if (score >= 50) return SCORE_COLORS.warm;
  return SCORE_COLORS.cold;
}
