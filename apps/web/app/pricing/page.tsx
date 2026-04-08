import { Navbar } from "@/components/layout/navbar";
import { PricingTeaser } from "@/components/sections/pricing-teaser";
import { FAQ } from "@/components/sections/faq";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Pricing — ByteBoundless",
  description: "Simple pricing for freelance web developers. Start free, upgrade when it pays for itself.",
};

export default function PricingPage() {
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
