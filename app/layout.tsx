import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Easton People Council",
  description: "Easton People Council",
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/rationale", label: "Rationale" },
  { href: "/proposal", label: "Proposal" },
  { href: "/petition", label: "Petition" },
  { href: "/press", label: "Press" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <div className="container">
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
      </body>
    </html>
  );
}
