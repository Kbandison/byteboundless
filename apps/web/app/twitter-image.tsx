// Re-export the OG image as the Twitter summary_large_image. They use
// the same 1200x630 size and the same branding — no reason to maintain
// two separate renders.
export { default, alt, size, contentType } from "./opengraph-image";
