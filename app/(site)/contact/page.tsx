import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { pickNiche, type SP } from "@/lib/site/params";
import { SITE } from "@/lib/site/content";

export const metadata: Metadata = { title: "Contact", description: "Ask a question or request a pilot. We reply in writing." };

export default async function ContactPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const kind = sp.type === "pilot" ? "pilot" : sp.type === "proof" ? "proof" : "question";
  return (
    <section className="section">
      <div className="wrap form-layout">
        <div className="stack" style={{ gap: 22 }}>
          <span className="eyebrow">Contact</span>
          <h1 className="h-lg">Ask us anything. We answer in writing.</h1>
          <p className="lede">We don&apos;t do sales calls. Send your question here and you&apos;ll get a clear written answer by email, drafted by our Sales agent and checked by a person.</p>
          <p className="muted">Prefer email? Write to <span className="mono">{SITE.email}</span>.</p>
        </div>
        <div className="form-card">
          <EnquiryForm kind={kind} niche={pickNiche(sp.niche)} />
        </div>
      </div>
    </section>
  );
}
