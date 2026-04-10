import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ByteBoundless — Find Businesses That Need Better Websites",
  description:
    "Lead intelligence for freelance web developers. Scrape Google Maps, score businesses by rebuild opportunity, and generate AI-powered pitch angles — all in one tool.",
  openGraph: {
    title: "ByteBoundless — Find Businesses That Need Better Websites",
    description:
      "Lead intelligence for freelance web developers. Scrape Google Maps, score businesses by rebuild opportunity, and generate AI-powered pitch angles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${interTight.variable}`}
      suppressHydrationWarning
    >
      <body>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
