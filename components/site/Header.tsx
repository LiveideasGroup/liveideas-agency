"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/services/forex-and-prop-firms", label: "Forex & prop firms" },
  { href: "/services/product-teams", label: "Product teams" },
  { href: "/services/qa-and-manual-testing", label: "QA & testing" },
  { href: "/how-we-work", label: "How we work" },
  { href: "/pilot", label: "Pilots" },
];

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" aria-label="LiveIdeas home"><Logo /></Link>
        <button className="menu-toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Menu"}
        </button>
        <nav id="site-nav" className="nav" data-open={open} aria-label="Main">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>{l.label}</Link>
          ))}
          <Link href="/proof" className="btn btn-primary btn-sm">Get a free proof</Link>
        </nav>
      </div>
    </header>
  );
}
