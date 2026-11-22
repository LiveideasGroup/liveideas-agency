import type { Metadata } from "next";
import Link from "next/link";
import { BuyPilot } from "@/components/site/BuyPilot";
import { Spark } from "@/components/site/Spark";
import { SERVICES, gbp } from "@/lib/site/content";

export const metadata: Metadata = { title: "Pilots", description: "Fixed-price AI pilots for forex firms, product teams and QA teams, bought online." };

export default function PilotPage() {
  return (
    <>
      <section className="page-hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap stack">
          <span className="eyebrow">Pilots</span>
          <h1 className="h-xl" style={{ fontSize: "clamp(36px, 5.2vw, 64px)" }}>A fixed scope, a fixed price, bought in two minutes.</h1>
          <p className="lede">Each pilot puts one working system live on your own tools. Pay online by card, send us a short brief, and we start. No call and no contract negotiation.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <ol className="offer">
            {SERVICES.map((s) => (
              <li key={s.id} className="step">
                <Spark kind={s.id} />
                <div className="step-top"><span className="step-no">{s.name.toUpperCase()}</span></div>
                <h2 className="h-md">{s.pilotTitle}</h2>
                <div className="price-big">{gbp(s.pilotPriceGbp)}<small>fixed, one-off</small></div>
                <ul>{s.pilotScope.map((x) => <li key={x}>{x}</li>)}</ul>
                <BuyPilot service={s} />
                <Link href={`/services/${s.slug}`} className="link small" style={{ alignSelf: "flex-start" }}>What else we build for {s.name.toLowerCase()}</Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">After you pay</span>
            <h2 className="h-lg">What happens next</h2>
          </div>
          <ol className="next-steps">
            <li><span className="n">1</span><div><b>Payment by Stripe</b>Card payment on Stripe&apos;s secure checkout. You get a receipt by email straight away.</div></li>
            <li><span className="n">2</span><div><b>Send a short brief</b>A form asks what to connect and who should receive updates.</div></li>
            <li><span className="n">3</span><div><b>Written kick-off</b>We confirm the scope and the access we need by email.</div></li>
            <li><span className="n">4</span><div><b>Live and reported</b>The pilot goes live on your systems, and you get a written report with results and options for the full build.</div></li>
          </ol>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <p className="muted small">Not sure yet? <Link href="/proof" className="link">Start with a free proof</Link>. Pilots are covered by our <Link href="/legal/terms" className="link">pilot terms</Link>, including a full refund if we can&apos;t start the work.</p>
        </div>
      </section>
    </>
  );
}
