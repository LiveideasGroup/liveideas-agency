import type { Metadata } from "next";
import { CtaBand } from "@/components/site/CtaBand";
import { AGENTS, SITE } from "@/lib/site/content";

export const metadata: Metadata = { title: "How we work", description: "How LiveIdeas agents work, what a person checks, and how we handle your data." };

export default function HowWeWork() {
  return (
    <>
      <section className="page-hero">
        <div className="hero-grid-bg" aria-hidden="true" />
        <div className="wrap stack">
          <span className="eyebrow">How we work</span>
          <h1 className="h-xl" style={{ fontSize: "clamp(36px, 5.2vw, 64px)" }}>Agents do the work. A person answers for it.</h1>
          <p className="lede">LiveIdeas is built differently from a normal consultancy. Here is exactly who does what, and the rules they follow.</p>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">The team</span>
            <h2 className="h-lg">One job per agent</h2>
            <p className="lede">Splitting the work keeps each agent focused, cheap to run and easy to check.</p>
          </div>
          <ul className="checklist">
            {AGENTS.map((a) => (
              <li key={a.id}>
                <span className="agent-tag" data-agent={a.id} style={{ paddingTop: 4 }} aria-hidden="true" />
                <div><b>{a.name}</b><span>{a.role}</span></div>
              </li>
            ))}
            <li>
              <span className="tick" aria-hidden="true">✓</span>
              <div><b>{SITE.owner}, founder</b><span>Sets the rules and budgets, reviews the work, and approves every email, proposal and delivery before it leaves.</span></div>
            </li>
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Why writing only</span>
            <h2 className="h-lg">No calls, on purpose</h2>
          </div>
          <div className="prose">
            <p>Everything we agree is written down: what we will build, what it costs, what we need from you and what done looks like. You can read it when it suits you, share it with your team and hold us to it.</p>
            <p>If something needs discussing, reply to any email. You will get a considered written answer rather than a quick verbal one.</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">Security</span>
            <h2 className="h-lg">How we look after your data</h2>
          </div>
          <ul className="checklist">
            {[
              ["Least access", "Agents get only the access a project needs, read-only wherever possible."],
              ["Two-step sign-in", "Our control room needs an email link and an authenticator app. The database refuses anything less."],
              ["Audit log", "Every change to approvals, settings and keys is recorded in an append-only, tamper-evident log."],
              ["Daily security agent", "Checks access rules, accounts, keys and dependencies every day and can stop all work on its own."],
              ["Deleted when done", "Project data is deleted when the work ends, or sooner if you ask. Enquiries are kept for at most 12 months."],
              ["Working towards SOC 2", "Our controls and evidence follow SOC 2 Security and Confidentiality. We have not been audited yet, and we will say so until we are."],
            ].map(([t, d]) => (
              <li key={t}><span className="tick" aria-hidden="true">✓</span><div><b>{t}</b><span>{d}</span></div></li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand title="Want to see how it would work for you?" />
    </>
  );
}
