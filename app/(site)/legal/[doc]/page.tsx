import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/site/content";

const UPDATED = "22 November 2026";

const DOCS: Record<string, { title: string; body: React.ReactNode }> = {
  privacy: {
    title: "Privacy notice",
    body: (
      <>
        <p>This notice explains what {SITE.name} does with information you send us through this website.</p>
        <h2>What we collect</h2>
        <ul>
          <li>What you type into our forms: your name, work email, company, website, role and message.</li>
          <li>A one-way hash of your IP address, changed daily, used only to limit spam. We do not store the address itself.</li>
          <li>If you buy a pilot, Stripe processes your payment. We receive your name, email and the payment status, never your card details.</li>
        </ul>
        <h2>Why we use it</h2>
        <p>To reply to your request and deliver the work you ask for (legitimate interests, and steps before a contract). We do not add you to a mailing list and we do not sell your data.</p>
        <h2>Who processes it</h2>
        <p>AI agents draft our replies using Anthropic&apos;s Claude. Our data is stored with Supabase, payments run through Stripe, and the site is hosted on Cloudflare. Each acts as our processor under its own data protection terms.</p>
        <h2>How long we keep it</h2>
        <p>Enquiries are deleted after 12 months. If you ask us not to contact you again, we keep only your company and email so we can honour that.</p>
        <h2>Your rights</h2>
        <p>You can ask for a copy of your data, ask us to correct or delete it, or object to how we use it. Email <span className="mono">{SITE.email}</span>. You can also complain to the Information Commissioner&apos;s Office (ico.org.uk).</p>
      </>
    ),
  },
  terms: {
    title: "Pilot terms",
    body: (
      <>
        <p>These terms apply when you buy a pilot on this website.</p>
        <h2>Scope and price</h2>
        <p>Each pilot has the fixed scope and price shown on the pilot page at the time you buy it. We confirm the scope in writing before we start. Anything beyond it is quoted separately, in writing, before any work.</p>
        <h2>Starting and refunds</h2>
        <p>We start once we have your brief and the access the scope needs. If we cannot start the work, or you cancel before we start, we refund you in full.</p>
        <h2>What you own</h2>
        <p>The code, prompts and documents we create for you become yours once the pilot is paid. We may reuse general know-how, but never your data or confidential material.</p>
        <h2>Your data</h2>
        <p>We use what you share only to deliver the pilot, keep it confidential, and delete it when the work ends or when you ask.</p>
        <h2>What pilots are not</h2>
        <p>We build tools for businesses. We do not provide investment, trading or financial advice, and nothing we build for forex businesses gives personal trading advice or signals to retail traders.</p>
        <h2>Liability</h2>
        <p>Our total liability for a pilot is limited to the price you paid for it. Nothing in these terms limits liability that cannot be limited by law.</p>
      </>
    ),
  },
  ai: {
    title: "AI disclosure",
    body: (
      <>
        <p>{SITE.name} is run by AI agents. We want that to be clear wherever you meet us.</p>
        <ul>
          <li>Our emails and proposals are drafted by AI agents. A person reviews and approves every one before it is sent.</li>
          <li>We never pretend an agent is a person. If you ask whether you are talking to AI, the answer is always yes.</li>
          <li>The activity feed on our home page shows real agent activity when it is marked Live, with no client names or details.</li>
          <li>The systems we build for you are tested by our QA agent and reviewed before delivery. You decide how they are used.</li>
        </ul>
      </>
    ),
  },
};

export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(DOCS).map((doc) => ({ doc }));

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const d = DOCS[(await params).doc];
  return d ? { title: d.title } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const d = DOCS[(await params).doc];
  if (!d) notFound();
  return (
    <section className="section">
      <div className="wrap prose">
        <span className="eyebrow">Legal · updated {UPDATED}</span>
        <h1 className="h-lg">{d.title}</h1>
        {d.body}
      </div>
    </section>
  );
}
