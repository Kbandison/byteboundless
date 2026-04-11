import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ResultsPreview } from "@/components/sections/results-preview";
import { Pipeline } from "@/components/sections/pipeline";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { FAQ } from "@/components/sections/faq";
import { Founder } from "@/components/sections/founder";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/layout/footer";

// Home page inherits the root metadata but overrides title/description
// with something more marketing-focused and pins the canonical URL at
// the site root. Next.js merges this with the root layout's Metadata
// so we don't have to restate openGraph etc.
export const metadata: Metadata = {
  title:
    "ByteBoundless — Find Businesses That Need Better Websites",
  description:
    "Find local businesses stuck on Wix, GoDaddy, or no website at all. Score every lead by rebuild opportunity, get AI-generated pitch emails, and close more freelance clients — all from one tool.",
  alternates: { canonical: "/" },
};

// JSON-LD structured data so Google can render the rich SoftwareApplication
// snippet in search results. Organization schema is combined in the same
// script tag for brand recognition.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "https://byteboundless.io/#software",
      name: "ByteBoundless",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Lead intelligence for freelance web developers. Scrape Google Maps, score businesses by rebuild opportunity, and generate AI-powered pitch angles.",
      url: "https://byteboundless.io",
      offers: [
        {
          "@type": "Offer",
          name: "Free Trial",
          price: "0",
          priceCurrency: "USD",
          description: "3 searches per month, 50 results per search",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "29",
          priceCurrency: "USD",
          description:
            "50 searches per month, 500 results per search, 200 AI pitches, Lighthouse audits",
        },
        {
          "@type": "Offer",
          name: "Agency",
          price: "79",
          priceCurrency: "USD",
          description:
            "200 searches per month, 1000 results per search, unlimited AI pitches, priority support",
        },
      ],
      aggregateRating: undefined,
    },
    {
      "@type": "Organization",
      "@id": "https://byteboundless.io/#organization",
      name: "ByteBoundless",
      url: "https://byteboundless.io",
      description:
        "Lead intelligence for freelance web developers.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://byteboundless.io/#website",
      url: "https://byteboundless.io",
      name: "ByteBoundless",
      publisher: { "@id": "https://byteboundless.io/#organization" },
      inLanguage: "en-US",
    },
  ],
};

export default async function Home() {
  // Logged-in users don't belong on the marketing landing page —
  // bounce them to the dashboard. Signup/login CTAs here only make
  // sense for anonymous visitors.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <>
      {/* JSON-LD structured data — rendered as raw JSON in a script
          tag so Google can parse it directly. Safe to inline since
          the object is static and free of user input. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <ResultsPreview />
      <Pipeline />
      <PricingTeaser />
      <FAQ />
      <Founder />
      <CTA />
      <Footer />
    </>
  );
}
