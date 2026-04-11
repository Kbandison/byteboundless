import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter_Tight } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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

const SITE_URL = "https://byteboundless.io";
const SITE_NAME = "ByteBoundless";
const DEFAULT_TITLE = "ByteBoundless — Find Businesses That Need Better Websites";
const DEFAULT_DESCRIPTION =
  "Lead intelligence for freelance web developers. Scrape Google Maps, score businesses by rebuild opportunity, and generate AI-powered pitch angles — all in one tool.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    // Child pages export shorter titles; this template is what renders
    // in the browser tab and in search results. Keep under 60 chars.
    template: "%s · ByteBoundless",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "ByteBoundless" }],
  creator: "ByteBoundless",
  publisher: "ByteBoundless",
  keywords: [
    "lead generation",
    "freelance web developer",
    "web development leads",
    "Google Maps scraper",
    "website audit tool",
    "cold outreach",
    "AI pitch generator",
    "Lighthouse audits",
    "client acquisition",
    "web design leads",
  ],
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    creator: "@byteboundless",
  },
  icons: {
    icon: "/favicon.ico",
  },
  category: "technology",
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
        {/* Vercel Analytics — fires a lightweight script on every
            route change that reports page views and unique visitors
            to the Analytics tab of the Vercel dashboard. No config
            needed; it auto-detects the project from the deployment. */}
        <Analytics />
      </body>
    </html>
  );
}
