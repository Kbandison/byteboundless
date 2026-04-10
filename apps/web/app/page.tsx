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
