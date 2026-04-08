export type TechPlatform =
  | "wix"
  | "squarespace"
  | "wordpress"
  | "godaddy"
  | "weebly"
  | "duda"
  | "webflow"
  | "shopify"
  | "nextjs"
  | "react"
  | "unknown";

export type EmailCategory = "business" | "developer" | "unknown";

export interface Email {
  address: string;
  category: EmailCategory;
  source: string;
}

export interface SocialProfile {
  platform: string;
  url: string;
}

export interface Socials {
  facebook?: SocialProfile;
  instagram?: SocialProfile;
  twitter?: SocialProfile;
  linkedin?: SocialProfile;
  youtube?: SocialProfile;
  tiktok?: SocialProfile;
}

export interface TechStack {
  platform: TechPlatform;
  confidence: number;
  signals: string[];
}

export interface Enrichment {
  emails: Email[];
  socials: Socials;
  techStack: TechStack[];
  hasMobileViewport: boolean | null;
  hasSSL: boolean | null;
  lastModified: string | null;
  pageLoadTime: number | null;
  blocked: boolean;
  crawledPages: number;
}

export interface LeadReason {
  signal: string;
  weight: number;
  detail: string;
}

export interface Business {
  id: string;
  jobId: string;
  name: string;
  website: string | null;
  phone: string | null;
  address: string | null;
  rating: number | null;
  reviews: number | null;
  category: string | null;
  unclaimed: boolean;
  enrichment: Enrichment | null;
  leadScore: number;
  leadReasons: LeadReason[];
  createdAt: string;
}
