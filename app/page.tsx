"use client";
import Link from "next/link";
import { useLiveTable } from "@/components/useLiveTable";
import { NICHE_LABELS, gbp, startOfUtcDay, startOfUtcMonth, usd, when } from "@/lib/format";

type Event = { id: number; agent: string; level: string; message: string; created_at: string };
type Lead = { niche: string; status: string };
type Setting = { key: string; value: unknown };

export default function Overview() {
  const events = useLiveTable<Event>("events", ["events"], (sb) =>
    sb.from("events").select("id, agent, level, message, created_at").order("created_at", { ascending: false }).limit(60),
  );
  const leads = useLiveTable<Lead>("leads", ["leads"], (sb) => sb.from("leads").select("niche, status"));
  const pending = useLiveTable<{ id: string }>("pending", ["approvals"], (sb) =>
    sb.from("approvals").select("id").eq("status", "pending"),
  );
  const revenue = useLiveTable<{ amount_gbp: number }>("revenue", ["revenue"], (sb) =>
    sb.from("revenue").select("amount_gbp").gte("received_on", startOfUtcMonth()),
  );
  const spend = useLiveTable<{ agent: string; usd: number }>("spend", ["spend"], (sb) =>
    sb.from("spend").select("agent, usd").gte("created_at", startOfUtcDay()),
  );
  const settings = useLiveTable<Setting>("settings", ["settings"], (sb) => sb.from("settings").select("key, value"));

  const setting = (k: string) => settings.rows.find((s) => s.key === k)?.value;
  const target = Number(setting("monthly_revenue_target_gbp") ?? 100000);
  const killed = setting("kill_switch") === true;
  const monthRevenue = revenue.rows.reduce((s, r) => s + Number(r.amount_gbp), 0);
  const spendToday = spend.rows.reduce((s, r) => s + Number(r.usd), 0);
  const briefing = events.rows.find((e) => e.level === "briefing");
  const firstError = [events, leads, pending, revenue, spend, settings].find((t) => t.error)?.error;

  const byNiche = Object.keys(NICHE_LABELS).map((niche) => {
    const rows = leads.rows.filter((l) => l.niche === niche);
    return {
      niche,
      total: rows.length,
      contacted: rows.filter((l) => !["new", "drafted"].includes(l.status)).length,
      replied: rows.filter((l) => ["replied", "proof_sent", "pilot_paid", "won"].includes(l.status)).length,
      paid: rows.filter((l) => ["pilot_paid", "won"].includes(l.status)).length,
    };
  });

  return (
    <main>
      <h1>Overview</h1>
      {killed && <div className="killed">Kill switch is on. All agents are paused. Turn it off on the Agents page.</div>}
      {firstError && <p className="error">Could not load data: {firstError}</p>}

      <section className="grid">
        <div className="card kpi">
          <div className="label">Revenue this month</div>
          <div className="value">{gbp(monthRevenue)}</div>
          <div className="sub">Target {gbp(target)}</div>
          <div className="bar"><span style={{ width: `${Math.min(100, (monthRevenue / target) * 100)}%` }} /></div>
        </div>
        <div className="card kpi">
          <div className="label">Waiting for your approval</div>
          <div className="value">{pending.rows.length}</div>
          <div className="sub"><Link href="/approvals">Review now</Link></div>
        </div>
        <div className="card kpi">
          <div className="label">Leads found</div>
          <div className="value">{leads.rows.length}</div>
          <div className="sub">{byNiche.map((n) => n.total).join(" / ")} by niche</div>
        </div>
        <div className="card kpi">
          <div className="label">AI spend today</div>
          <div className="value">{usd(spendToday)}</div>
          <div className="sub"><Link href="/agents">Budgets per agent</Link></div>
        </div>
      </section>

      <section className="card">
        <h2>Niche race</h2>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Niche</th><th>Leads</th><th>Contacted</th><th>Replied or further</th><th>Paid</th></tr>
            </thead>
            <tbody>
              {byNiche.map((n) => (
                <tr key={n.niche}>
                  <td>{NICHE_LABELS[n.niche]}</td><td>{n.total}</td><td>{n.contacted}</td><td>{n.replied}</td><td>{n.paid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="two">
        <section className="card">
          <h2>Latest CEO briefing</h2>
          {briefing ? (
            <>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{briefing.message}</p>
              <span className="muted">{when(briefing.created_at)}</span>
            </>
          ) : (
            <p className="muted">No briefing yet. The CEO agent writes one each day.</p>
          )}
        </section>
        <section className="card">
          <h2>Live activity</h2>
          <ul className="feed">
            {events.rows.map((e) => (
              <li key={e.id}>
                <div className="row">
                  <span className={`tag ${e.level}`}>{e.agent}</span>
                  <span className="meta">{when(e.created_at)}</span>
                </div>
                <div>{e.message}</div>
              </li>
            ))}
            {!events.loading && events.rows.length === 0 && <li className="muted">Nothing yet.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
