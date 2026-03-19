import DonateButton from "@/components/DonateButton";
import { SHOW_PETITION } from "@/lib/feature-flags";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "A People's Council for Easton",
  description: "Together let's explore what a People's Council could look and feel like for us in Easton.",
};

const navLinks = [
  { href: "/rationale", label: "Rationale" },
  { href: "/proposal", label: "Proposal" },
  ...(SHOW_PETITION ? [{ href: "/petition" as const, label: "Petition" as const }] : []),
  { href: "/press", label: "Press" },
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <div className="headerLogoBlock">
            <div className="container">
              <Link href="/" className="siteBrand" aria-label="A Community Council for Easton – Home">
                <Image
                  src="/logo.png"
                  alt="A Community Council for Easton"
                  width={227}
                  height={110}
                  className="siteBrandLogo"
                  priority
                />
              </Link>
            </div>
          </div>
          <div className="headerNavBar">
            <div className="container">
              <nav>
                {navLinks.map(({ href, label }) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="siteFooter">
          <div className="container">
            <DonateButton />
          </div>
        </footer>
      </body>
    </html>
  );
}
