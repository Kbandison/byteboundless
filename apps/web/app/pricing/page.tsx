import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { FAQ } from "@/components/sections/faq";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Pricing — ByteBoundless",
  description: "Simple pricing for freelance web developers. Start free, upgrade when it pays for itself.",
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
