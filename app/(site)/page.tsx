import Link from "next/link";
import { LiveFeed } from "@/components/site/LiveFeed";
import { Spark } from "@/components/site/Spark";
import { CtaBand } from "@/components/site/CtaBand";
import { getFeed } from "@/lib/site/activity";
import { AGENTS, SERVICES, SITE, gbp } from "@/lib/site/content";

export const revalidate = 30;

const minPilot = Math.min(...SERVICES.map((s) => s.pilotPriceGbp));

export default async function Home() {
  const feed = await getFeed();
  return (
    <>
      <section className="hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true" />
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">AI consultancy · run by agents</span>
            <h1 className="h-xl">
              An AI consultancy you can <span className="accent">watch working.</span>
            </h1>
            <p className="lede">
              Our agents research, build and test AI systems for forex firms, product teams and QA teams. Start with a free proof built on
              your problem, then a fixed-price pilot you buy online.
            </p>
            <div className="btn-row">
              <Link href="/proof" className="btn btn-primary">Get a free proof <span className="arrow" aria-hidden="true">→</span></Link>
              <Link href="/pilot" className="btn btn-ghost">Pilots from {gbp(minPilot)}</Link>
            </div>
            <div className="trust-row">
              <span>No sales calls</span>
              <span>Fixed prices</span>
              <span>A human approves every send</span>
            </div>
          </div>
          <LiveFeed initial={feed} />
        </div>
      </section>

      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Who we build for</span>
            <h2 className="h-lg">Three industries. Systems built for how they actually work.</h2>
          </div>
          <div className="niche-grid">
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="niche-card">
                <Spark kind={s.id} />
                <h3 className="h-md">{s.name}</h3>
                <p className="muted small">{s.short}</p>
                <ul>{s.builds.slice(0, 3).map((b) => <li key={b.title}>{b.title}</li>)}</ul>
                <span className="more">
                  <span>See services <span aria-hidden="true">→</span></span>
                  <span className="price">pilot {gbp(s.pilotPriceGbp)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="process">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">How buying works</span>
            <h2 className="h-lg">Proof, then pilot, then the full build. All in writing.</h2>
            <p className="lede">You never have to book a call. Every step is written down, priced up front, and yours to stop at any point.</p>
          </div>
          <ol className="path">
            <li className="step">
              <div className="step-top"><span className="step-no">STEP 1</span><span className="pill pill-accent">Free</span></div>
              <h3 className="h-md">Free proof</h3>
              <p>Tell us the problem in a short form. Our agents build a small working example on your public material or a sample you share, and send it by email.</p>
              <div className="step-meta"><span>Costs you</span><span>Nothing</span></div>
            </li>
            <li className="step">
              <div className="step-top"><span className="step-no">STEP 2</span><span className="pill">Bought online</span></div>
              <h3 className="h-md">Fixed-price pilot</h3>
              <p>If the proof is useful, buy a pilot online. A fixed scope, live on your systems in about two weeks, with a clear report at the end.</p>
              <div className="step-meta"><span>From</span><span className="num">{gbp(minPilot)}</span></div>
            </li>
            <li className="step">
              <div className="step-top"><span className="step-no">STEP 3</span><span className="pill">By email</span></div>
              <h3 className="h-md">Full build</h3>
              <p>We send a written proposal with milestones and a fixed price for the full system, plus an optional monthly plan to run and improve it.</p>
              <div className="step-meta"><span>Scoped from</span><span>your pilot</span></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section" id="agents">
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">Who does the work</span>
            <h2 className="h-lg">A team of specialist agents, with one person in charge.</h2>
            <p className="lede">Each agent has one job, a budget and a set of rules. {SITE.owner}, the founder, reviews their work and approves everything that leaves the company.</p>
          </div>
          <div className="roster">
            {AGENTS.map((a) => (
              <div key={a.id} data-agent={a.id}>
                <h3 className="h-sm">{a.name}</h3>
                <p>{a.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="trust">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Guardrails</span>
            <h2 className="h-lg">Fast because it is automated. Safe because it is checked.</h2>
            <p className="lede">Agents move quickly. These rules stop them moving anywhere they shouldn&apos;t.</p>
            <div><Link href="/how-we-work" className="link">Read how we work</Link></div>
          </div>
          <ul className="checklist">
            {[
              ["Nothing is sent without approval", "Every email, proposal and deliverable is reviewed by a person before it reaches you."],
              ["Your data stays scoped", "Agents see only what your project needs, and we delete it when the work ends or when you ask."],
              ["Every action is logged", "An append-only audit log records who changed what, and a security agent checks access every day."],
              ["You own the result", "The code, prompts and documentation we build for you are yours."],
              ["No advice we shouldn't give", "We build tools for firms. We never provide trading signals or personal financial advice."],
            ].map(([t, d]) => (
              <li key={t}>
                <span className="tick" aria-hidden="true">✓</span>
                <div><b>{t}</b><span>{d}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
