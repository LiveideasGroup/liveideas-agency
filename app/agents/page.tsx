"use client";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useLiveTable } from "@/components/useLiveTable";
import { NICHE_LABELS, startOfUtcDay, usd, when } from "@/lib/format";

type Agent = {
  name: string;
  title: string;
  enabled: boolean;
  model: string;
  effort: string;
  daily_budget_usd: number;
  schedule_minutes: number;
  last_run_at: string | null;
};
type Setting = { key: string; value: unknown };

export default function AgentsPage() {
  const agents = useLiveTable<Agent>("agents", ["agents"], (sb) => sb.from("agents").select("*").order("name"));
  const spend = useLiveTable<{ agent: string; usd: number }>("spend-today", ["spend"], (sb) =>
    sb.from("spend").select("agent, usd").gte("created_at", startOfUtcDay()),
  );
  const tasks = useLiveTable<{ agent: string; status: string }>("open-tasks", ["tasks"], (sb) =>
    sb.from("tasks").select("agent, status").in("status", ["queued", "running"]),
  );
  const settings = useLiveTable<Setting>("settings-agents", ["settings"], (sb) => sb.from("settings").select("key, value"));
  const sb = agents.sb;
  const killed = settings.rows.find((s) => s.key === "kill_switch")?.value === true;

  async function update(name: string, patch: Partial<Agent>) {
    const { error } = await sb.from("agents").update(patch).eq("name", name);
    if (error) alert(error.message);
  }

  async function setKill(on: boolean) {
    if (on && !confirm("Pause every agent and stop all sending?")) return;
    const { error } = await sb.from("settings").update({ value: on }).eq("key", "kill_switch");
    if (error) alert(error.message);
  }

  return (
    <main>
      <h1>Agents</h1>
      <section className="card row" style={{ justifyContent: "space-between" }}>
        <div>
          <strong>Kill switch</strong>
          <div className="muted">{killed ? "On: every agent is paused and nothing is sent." : "Off: agents run on their schedules."}</div>
        </div>
        {killed ? (
          <button className="primary" onClick={() => setKill(false)}>Resume agents</button>
        ) : (
          <button className="danger" onClick={() => setKill(true)}>Pause everything</button>
        )}
      </section>

      {agents.error && <p className="error">{agents.error}</p>}
      <section className="card scroll">
        <table>
          <thead>
            <tr>
              <th>Agent</th><th>On</th><th>Effort</th><th>Daily budget (USD)</th><th>Spent today</th>
              <th>Open tasks</th><th>Last run</th><th></th>
            </tr>
          </thead>
          <tbody>
            {agents.rows.map((a) => {
              const spent = spend.rows.filter((s) => s.agent === a.name).reduce((t, s) => t + Number(s.usd), 0);
              const open = tasks.rows.filter((t) => t.agent === a.name).length;
              return (
                <tr key={a.name}>
                  <td><strong>{a.title}</strong><div className="muted">{a.model}</div></td>
                  <td>
                    <input type="checkbox" style={{ width: "auto" }} checked={a.enabled}
                      onChange={(e) => update(a.name, { enabled: e.target.checked })} aria-label={`${a.title} enabled`} />
                  </td>
                  <td>
                    <select value={a.effort} onChange={(e) => update(a.name, { effort: e.target.value })} aria-label="Effort">
                      {["low", "medium", "high", "xhigh"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </td>
                  <td>
                    <BudgetInput value={Number(a.daily_budget_usd)} onSave={(v) => update(a.name, { daily_budget_usd: v })} />
                  </td>
                  <td>{usd(spent)}</td>
                  <td>{open}</td>
                  <td className="muted">{a.last_run_at ? when(a.last_run_at) : "never"}</td>
                  <td>
                    {a.name === "ceo" && (
                      <button onClick={() => update(a.name, { last_run_at: null })} title="Runs at the worker's next tick">
                        Run now
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <RevenueForm />
    </main>
  );
}

function BudgetInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <input type="number" min={0} step={0.5} value={v} style={{ width: 90 }}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => Number(v) !== value && Number(v) >= 0 && onSave(Number(v))} aria-label="Daily budget" />
  );
}

function RevenueForm() {
  const sb = useRef(supabaseBrowser()).current;
  const [amount, setAmount] = useState("");
  const [niche, setNiche] = useState("manual_testing");
  const [kind, setKind] = useState("pilot");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await sb.from("revenue").insert({ amount_gbp: Number(amount), niche, kind, note: note || null });
    if (error) return alert(error.message);
    setSaved(`Recorded £${amount}`);
    setAmount("");
    setNote("");
  }

  return (
    <section className="card">
      <h2>Record a payment</h2>
      <p className="muted">Until Stripe is connected, add payments here so the revenue numbers stay right.</p>
      <form onSubmit={submit} className="row">
        <input type="number" min={1} required placeholder="Amount (£)" value={amount}
          onChange={(e) => setAmount(e.target.value)} style={{ width: 140 }} aria-label="Amount in pounds" />
        <select value={niche} onChange={(e) => setNiche(e.target.value)} style={{ width: "auto" }} aria-label="Niche">
          {Object.entries(NICHE_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ width: "auto" }} aria-label="Kind">
          {["pilot", "build", "retainer", "other"].map((k) => <option key={k}>{k}</option>)}
        </select>
        <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
          style={{ flex: 1, minWidth: 160 }} aria-label="Note" />
        <button className="primary" type="submit">Save</button>
        {saved && <span className="muted">{saved}</span>}
      </form>
    </section>
  );
}
