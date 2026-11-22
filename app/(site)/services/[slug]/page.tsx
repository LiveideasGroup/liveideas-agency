import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyPilot } from "@/components/site/BuyPilot";
import { CtaBand } from "@/components/site/CtaBand";
import { Spark } from "@/components/site/Spark";
import { SERVICES, gbp, serviceBySlug } from "@/lib/site/content";

export const dynamicParams = false;
export const generateStaticParams = () => SERVICES.map((s) => ({ slug: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = serviceBySlug((await params).slug);
  return s ? { title: `AI for ${s.name}`, description: s.short } : {};
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = serviceBySlug((await params).slug);
  if (!s) notFound();
  return (
    <>
      <section className="page-hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap stack">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>Services</span><span>/</span><span>{s.name}</span></nav>
          <div style={{ maxWidth: 260 }}><Spark kind={s.id} /></div>
          <span className="eyebrow">{s.name}</span>
          <h1 className="h-xl" style={{ fontSize: "clamp(36px, 5.2vw, 64px)" }}>{s.headline}</h1>
          <p className="lede">{s.intro}</p>
          <div className="btn-row">
            <Link href={`/proof?niche=${s.id}`} className="btn btn-primary">Get a free proof <span className="arrow" aria-hidden="true">→</span></Link>
            <BuyPilot service={s} ghost />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Sound familiar?</span>
            <h2 className="h-lg">What we hear from teams like yours</h2>
          </div>
          <ul className="problems">{s.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">What we build</span>
            <h2 className="h-lg">Systems that take the repetitive work off your team</h2>
          </div>
          <div className="builds">
            {s.builds.map((b) => (
              <article key={b.title} className="build">
                <h3 className="h-sm">{b.title}</h3>
                <p>{b.body}</p>
              </article>
            ))}
          </div>
          {s.note && <p className="notice" style={{ marginTop: 24 }}>{s.note}</p>}
        </div>
      </section>

      <section className="section" id="offer">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How to start</span>
            <h2 className="h-lg">Three steps, each priced before you begin</h2>
          </div>
          <ol className="offer">
            <li className="step">
              <div className="step-top"><span className="step-no">STEP 1</span><span className="pill pill-accent">Free</span></div>
              <h3 className="h-md">Free proof</h3>
              <p>{s.proof}</p>
              <div className="step-meta"><span>Costs you</span><span>Nothing</span></div>
              <Link href={`/proof?niche=${s.id}`} className="btn btn-ghost">Request the proof</Link>
            </li>
            <li className="step featured">
              <div className="step-top"><span className="step-no">STEP 2</span><span className="pill">Bought online</span></div>
              <h3 className="h-md">{s.pilotTitle}</h3>
              <div className="price-big">{gbp(s.pilotPriceGbp)}<small>fixed, one-off</small></div>
              <ul>{s.pilotScope.map((x) => <li key={x}>{x}</li>)}</ul>
              <BuyPilot service={s} />
            </li>
            <li className="step">
              <div className="step-top"><span className="step-no">STEP 3</span><span className="pill">By email</span></div>
              <h3 className="h-md">Full build</h3>
              <p>{s.fullBuild}</p>
              <div className="step-meta"><span>Proposal</span><span>In writing, with milestones</span></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Questions</span>
            <h2 className="h-lg">Answered in writing</h2>
            <p className="lede">Anything else? <Link href={`/contact?niche=${s.id}`} className="link">Ask us</Link> and the Sales agent replies by email, checked by a person.</p>
          </div>
          <div className="faqs">
            {s.faqs.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
