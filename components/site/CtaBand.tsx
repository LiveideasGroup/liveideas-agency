import Link from "next/link";

export function CtaBand({ title = "See it working on your problem first.", body = "Tell us what slows your team down. We build a small working proof and send it to you, free. No call needed, ever." }: { title?: string; body?: string }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-band">
          <div className="stack" style={{ gap: 14 }}>
            <h2 className="h-lg">{title}</h2>
            <p className="lede">{body}</p>
          </div>
          <div className="btn-row">
            <Link href="/proof" className="btn btn-primary">Get a free proof <span className="arrow" aria-hidden="true">→</span></Link>
            <Link href="/pilot" className="btn btn-ghost">See pilot prices</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
