import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { pickNiche, type SP } from "@/lib/site/params";
import { SERVICES } from "@/lib/site/content";

export const metadata: Metadata = { title: "Get a free proof", description: "Tell us the problem. We build a small working proof and send it by email, free." };

export default async function ProofPage({ searchParams }: { searchParams: SP }) {
  const niche = pickNiche((await searchParams).niche);
  return (
    <section className="section">
      <div className="wrap form-layout">
        <div className="stack" style={{ gap: 22 }}>
          <span className="eyebrow">Free proof</span>
          <h1 className="h-lg">See it working on your problem before you pay anything.</h1>
          <p className="lede">Describe what slows your team down. Our agents build a small working example and email it to you. No call, no commitment.</p>
          <ol className="next-steps">
            <li><span className="n">1</span><div><b>You send the brief</b>Two minutes, on this page.</div></li>
            <li><span className="n">2</span><div><b>We reply in writing</b>Confirming what we&apos;ll build and asking for anything we need.</div></li>
            <li><span className="n">3</span><div><b>You get the proof</b>A working example by email, with a short note on what a pilot would add.</div></li>
          </ol>
          <div className="stack" style={{ gap: 10 }}>
            <span className="eyebrow">What the proof looks like</span>
            <ul className="next-steps">
              {SERVICES.map((s) => <li key={s.id}><span className="n" aria-hidden="true">→</span><div><b>{s.name}</b>{s.proof}</div></li>)}
            </ul>
          </div>
        </div>
        <div className="form-card">
          <EnquiryForm kind="proof" niche={niche} fixedKind />
        </div>
      </div>
    </section>
  );
}
