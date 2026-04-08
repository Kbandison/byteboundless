import Link from "next/link";
import { FOOTER_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] pt-16 pb-8 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              ByteBoundless
            </span>
            <p className="text-sm text-[var(--color-text-secondary)] mt-3 max-w-xs leading-relaxed">
              Lead intelligence for freelance web developers. Find businesses
              that need better websites.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-[family-name:var(--font-display)] font-bold text-sm">
            ByteBoundless
          </span>
          <p className="text-xs text-[var(--color-text-secondary)]">
            &copy; {new Date().getFullYear()} ByteBoundless. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
