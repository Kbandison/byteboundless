import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { FAQ } from "@/components/sections/faq";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for freelance web developers. Free trial with 3 searches, Pro at $29/mo with Lighthouse audits and AI pitches, Agency at $79/mo for heavy outreach. Cancel anytime.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — ByteBoundless",
    description:
      "Free trial, Pro at $29/mo, Agency at $79/mo. Lead intelligence for freelance web developers.",
    url: "https://byteboundless.io/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — ByteBoundless",
    description:
      "Free trial, Pro at $29/mo, Agency at $79/mo. Cancel anytime.",
  },
};

export default async function PricingPage() {
  // Logged-in users see their own billing page inside the app —
  // this marketing pricing page is only for anonymous visitors deciding
  // whether to sign up.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/settings#billing");
  }

  return (
    <>
      <Navbar />
      <div className="pt-24">
        <PricingTeaser />
        <FAQ />
      </div>
      <Footer />
    </>
  );
}
