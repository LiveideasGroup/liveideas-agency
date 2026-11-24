import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/CtaBand";
import { CASE_STUDIES } from "@/lib/site/catalogue";

export const metadata: Metadata = {
  title: "Case studies",
  description: "AI systems LiveIdeas has built: a gold trading AI monitor, the ElenaSchool portal, and our own AI phone receptionist.",
};

export default function CaseStudies() {
  return (
    <>
      <section className="page-hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap stack">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Case studies</span></nav>
          <span className="eyebrow">Our work</span>
          <h1 className="h-xl" style={{ fontSize: "clamp(36px, 5.2vw, 64px)" }}>Systems we have built, including the ones we run ourselves.</h1>
          <p className="lede">
            We only publish what is true. No made-up clients and no inflated numbers: where a result isn&apos;t measured yet, we say so.
          </p>
        </div>
      </section>

      {CASE_STUDIES.map((c) => (
        <section className="section" id={c.slug} key={c.slug}>
          <div className="wrap split">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <span className="eyebrow">{c.service}</span>
              <h2 className="h-lg">{c.title}</h2>
              <div className="btn-row" style={{ gap: 8 }}>
                <span className={`pill${c.status === "In build" ? "" : " pill-accent"}`}>{c.status}</span>
                <span className="pill">For: {c.forWhom}</span>
              </div>
            </div>
            <div className="stack" style={{ gap: 20 }}>
              <p className="lede">{c.summary}</p>
              <ul className="checklist">
                {c.points.map((p) => (
                  <li key={p}><span className="tick" aria-hidden="true">✓</span><div><span>{p}</span></div></li>
                ))}
              </ul>
              {c.writeupComing && <p className="small muted">A full write-up of how it works is on the way.</p>}
              <div><Link href={`/services#${c.serviceId}`} className="link">About this service</Link></div>
            </div>
          </div>
        </section>
      ))}

      <CtaBand title="Want something like this?" />
    </>
  );
}
