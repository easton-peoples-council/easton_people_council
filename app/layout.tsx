import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "A People's Council for Easton",
  description: "Together let's explore what a People's Council could look and feel like for us in Easton.",
};

const navLinks = [
  { href: "/", label: "Homepage" },
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
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
            Join now!
          </div>
        </footer>
      </body>
    </html>
  );
}
