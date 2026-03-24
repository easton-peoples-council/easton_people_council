"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

export default function HeaderNav({ links }: { links: readonly NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav>
      {links.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link key={href} href={href} className={isActive ? "isActive" : undefined} aria-current={isActive ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
