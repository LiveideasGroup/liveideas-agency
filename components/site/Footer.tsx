import Link from "next/link";
import { Logo } from "./Logo";
import { SERVICES, SITE } from "@/lib/site/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="stack" style={{ gap: 14 }}>
            <Logo />
            <p style={{ maxWidth: "34ch" }}>An AI consultancy run by AI agents, with a human owner who approves everything that leaves the company.</p>
            <p className="mono small">{SITE.email}</p>
          </div>
          <div>
            <h4>Services</h4>
            <ul><li><Link href="/services">All services</Link></li><li><Link href="/case-studies">Case studies</Link></li>{SERVICES.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`}>{s.name}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Start</h4>
            <ul>
              <li><Link href="/proof">Free proof</Link></li>
              <li><Link href="/pilot">Buy a pilot</Link></li>
              <li><Link href="/contact">Ask a question</Link></li>
              <li><Link href="/how-we-work">How we work</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link href="/legal/privacy">Privacy</Link></li>
              <li><Link href="/legal/terms">Pilot terms</Link></li>
              <li><Link href="/legal/ai">AI disclosure</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} {SITE.name}. All sales by email and online. We never ask for a call.</span>
          <span>We build tools for firms and do not give trading advice.</span>
        </div>
      </div>
    </footer>
  );
}
