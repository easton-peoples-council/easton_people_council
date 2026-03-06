import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import DonateButton from "@/components/DonateButton";
import { SHOW_PETITION } from "@/lib/feature-flags";

export const metadata: Metadata = {
  title: "A People's Council for Easton",
  description: "Together let's explore what a People's Council could look and feel like for us in Easton.",
};

const navLinks = [
  { href: "/", label: "Homepage" },
  { href: "/rationale", label: "Rationale" },
  { href: "/proposal", label: "Proposal" },
  ...(SHOW_PETITION ? [{ href: "/petition" as const, label: "Petition" as const }] : []),
  { href: "/press", label: "Press" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head></head>
      <body>
        <header className="siteHeader">
          <div className="container headerInner">
            <Link href="/" className="siteBrand">
              A Community Council for Easton?
            </Link>
            <nav>
              {navLinks.map(({ href, label }) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
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
