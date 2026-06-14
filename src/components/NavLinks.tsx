"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Watchlists" },
  { href: "/dashboard/reports", label: "Reports" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label }) => {
        const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
        return (
          <Link
            key={href}
            href={href}
            className={`font-mono text-xs uppercase tracking-wider transition-colors ${
              isActive
                ? "text-foreground font-bold"
                : "text-muted-foreground hover:text-accent-link"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
