import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/CtaBand";
import { ServiceCard } from "@/components/site/ServiceCards";
import { CATALOGUE, QUICK_SYSTEMS, RETAINER } from "@/lib/site/catalogue";
import { SERVICES } from "@/lib/site/content";

export const metadata: Metadata = {
  title: "Services and prices",
  description: "Custom AI systems, AI receptionists, trading monitoring, support and QA agents, and quick systems we can set up in days. Typical prices up front.",
};

export default function ServicesIndex() {
  return (
    <>
      <section className="page-hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap stack">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Services</span></nav>
          <span className="eyebrow">Services and prices</span>
          <h1 className="h-xl" style={{ fontSize: "clamp(36px, 5.2vw, 64px)" }}>AI systems built for your business, priced before we start.</h1>
          <p className="lede">
            From a one-week setup to a full custom system. Every project gets a written scope and a fixed price, and you can start with a free proof.
          </p>
          <div className="btn-row">
            <Link href="/proof" className="btn btn-primary">Get a free proof <span className="arrow" aria-hidden="true">→</span></Link>
            <Link href="/case-studies" className="btn btn-ghost">See our work</Link>
          </div>
        </div>
      </section>

      <section className="section" id="core">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">What we build</span>
            <h2 className="h-lg">Core services</h2>
            <p className="lede">Typical prices. Your fixed price comes in writing once we understand the job.</p>
          </div>
          <div className="svc-grid">{CATALOGUE.map((s) => <ServiceCard key={s.id} s={s} />)}</div>
        </div>
      </section>

      <section className="section" id="quick">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Live in days</span>
            <h2 className="h-lg">Quick systems</h2>
            <p className="lede">Small, proven automations we set up on tools you may already use. A good first project, or an add-on to a bigger build.</p>
          </div>
          <div className="quick-table" role="table" aria-label="Quick systems and prices">
            <div className="quick-row quick-head" role="row">
              <span role="columnheader">System</span>
              <span role="columnheader">Works with</span>
              <span role="columnheader">Setup</span>
              <span role="columnheader">Monthly</span>
            </div>
            {QUICK_SYSTEMS.map((q) => (
              <div className="quick-row" role="row" key={q.name}>
                <span role="cell"><b>{q.name}</b><small>{q.does}</small></span>
                <span role="cell" className="muted">{q.tools}</span>
                <span role="cell" className="num" data-label="Setup">{q.setup}</span>
                <span role="cell" className="num" data-label="Monthly">{q.monthly}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="care">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">After launch</span>
            <h2 className="h-lg">{RETAINER.name}</h2>
            <p className="lede">{RETAINER.summary}</p>
            <p className="price-big">{RETAINER.price.replace(" a month", "")}<small>a month</small></p>
          </div>
          <div className="stack" style={{ gap: 16 }}>
            <span className="eyebrow">By industry</span>
            <div className="niche-links">
              {SERVICES.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  <b>{s.name}</b>
                  <span>{s.short}</span>
                  <span className="arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
