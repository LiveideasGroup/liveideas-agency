import type { Metadata } from "next";
import { EnquiryForm } from "@/components/site/EnquiryForm";
import { pickNiche, type SP } from "@/lib/site/params";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

export default async function PilotThanks({ searchParams }: { searchParams: SP }) {
  const niche = pickNiche((await searchParams).niche);
  return (
    <section className="section">
      <div className="wrap form-layout">
        <div className="stack" style={{ gap: 22 }}>
          <span className="tick-lg" aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(93,219,168,.5)", color: "var(--good)", display: "grid", placeItems: "center" }}>✓</span>
          <span className="eyebrow">Payment received</span>
          <h1 className="h-lg">Thank you. Let&apos;s get your pilot started.</h1>
          <p className="lede">Stripe has emailed your receipt. Send us a short brief so we can confirm the scope in writing. Use the same email you paid with.</p>
        </div>
        <div className="form-card">
          <EnquiryForm kind="pilot" niche={niche} fixedKind />
        </div>
      </div>
    </section>
  );
}
