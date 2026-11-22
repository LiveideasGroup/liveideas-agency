"use client";
import { useLiveTable } from "@/components/useLiveTable";
import { when } from "@/lib/format";

type Finding = {
  id: string; check_id: string; severity: string; title: string; detail: string | null;
  status: string; first_seen: string; last_seen: string; owner_note: string | null;
};
type Key = { name: string; purpose: string; stored_in: string; last_rotated_on: string | null; rotate_every_days: number };
type Control = { id: string; title: string; criteria: string; every_days: number; last_done_on: string | null; note: string | null };
type Audit = { id: number; at: string; actor: string; table_name: string; op: string; row_key: string | null };
type Evidence = { id: number; collected_at: string; control: string; summary: string; sha256: string };

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const today = () => new Date().toISOString().slice(0, 10);
const isDue = (last: string | null, days: number) => !last || Date.now() - new Date(last).getTime() > days * 86_400_000;

export default function SecurityPage() {
  const findings = useLiveTable<Finding>("findings", ["security_findings"], (sb) =>
    sb.from("security_findings").select("*").in("status", ["open", "accepted"]).order("first_seen", { ascending: false }),
  );
  const keys = useLiveTable<Key>("keys", ["key_register"], (sb) => sb.from("key_register").select("*").order("name"));
  const controls = useLiveTable<Control>("controls", ["controls"], (sb) => sb.from("controls").select("*").order("id"));
  const audit = useLiveTable<Audit>("audit", ["audit_log"], (sb) =>
    sb.from("audit_log").select("id, at, actor, table_name, op, row_key").order("id", { ascending: false }).limit(30),
  );
  const evidence = useLiveTable<Evidence>("evidence", ["compliance_evidence"], (sb) =>
    sb.from("compliance_evidence").select("id, collected_at, control, summary, sha256").order("id", { ascending: false }).limit(15),
  );
  const sb = findings.sb;
  const firstError = [findings, keys, controls, audit, evidence].find((t) => t.error)?.error;

  const open = findings.rows.filter((f) => f.status === "open")
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));
  const accepted = findings.rows.filter((f) => f.status === "accepted");
  const dueControls = controls.rows.filter((c) => isDue(c.last_done_on, c.every_days));
  const dueKeys = keys.rows.filter((k) => isDue(k.last_rotated_on, k.rotate_every_days));

  async function save(table: string, match: Record<string, string>, patch: Record<string, unknown>) {
    let q = sb.from(table).update(patch);
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v);
    const { error } = await q;
    if (error) alert(error.message);
  }

  async function accept(f: Finding) {
    const note = prompt(`Why is it OK to accept "${f.title}" for now? This is kept in the audit log.`);
    if (note) await save("security_findings", { id: f.id }, { status: "accepted", owner_note: note });
  }

  return (
    <main>
      <h1>Security</h1>
      <p className="muted">
        The Security agent checks the app every day and the Compliance agent saves audit evidence every week. Items
        marked here are recorded in the tamper-evident audit log.
      </p>
      {firstError && <p className="error">Could not load data: {firstError}</p>}

      <section className="grid">
        <div className="card kpi">
          <div className="label">Open findings</div>
          <div className={`value ${open.length ? "status-bad" : "status-ok"}`}>{open.length}</div>
        </div>
        <div className="card kpi">
          <div className="label">Controls due</div>
          <div className={`value ${dueControls.length ? "status-due" : "status-ok"}`}>{dueControls.length}</div>
        </div>
        <div className="card kpi">
          <div className="label">Keys due for rotation</div>
          <div className={`value ${dueKeys.length ? "status-due" : "status-ok"}`}>{dueKeys.length}</div>
        </div>
      </section>

      <section className="card">
        <h2>Open findings</h2>
        {open.length === 0 && <p className="status-ok">All checks passing.</p>}
        {open.map((f) => (
          <div key={f.id} style={{ borderTop: "1px solid var(--line)", padding: "8px 0" }}>
            <div className="row">
              <span className={`tag ${f.severity === "critical" || f.severity === "high" ? "warn" : ""}`}>{f.severity}</span>
              <strong>{f.title}</strong>
              <span className="muted">since {when(f.first_seen)}</span>
            </div>
            <p style={{ margin: "4px 0" }}>{f.detail}</p>
            <button onClick={() => accept(f)}>Accept risk for now</button>
          </div>
        ))}
        {accepted.length > 0 && (
          <p className="muted">Accepted: {accepted.map((f) => `${f.title} (${f.owner_note})`).join("; ")}</p>
        )}
      </section>

      <section className="card scroll">
        <h2>Recurring checks for you</h2>
        <table>
          <thead><tr><th>Control</th><th>SOC 2</th><th>Every</th><th>Last done</th><th></th></tr></thead>
          <tbody>
            {controls.rows.map((c) => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td className="muted">{c.criteria}</td>
                <td>{c.every_days} days</td>
                <td className={isDue(c.last_done_on, c.every_days) ? "status-due" : ""}>{c.last_done_on ?? "never"}</td>
                <td><button onClick={() => save("controls", { id: c.id }, { last_done_on: today() })}>Mark done today</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card scroll">
        <h2>Key register</h2>
        <p className="muted">Rotate a key at its provider, update it on the worker host, then mark it here. Never paste keys into this page.</p>
        <table>
          <thead><tr><th>Key</th><th>Used for</th><th>Stored in</th><th>Last rotated</th><th></th></tr></thead>
          <tbody>
            {keys.rows.map((k) => (
              <tr key={k.name}>
                <td><code>{k.name}</code></td>
                <td>{k.purpose}</td>
                <td className="muted">{k.stored_in}</td>
                <td className={isDue(k.last_rotated_on, k.rotate_every_days) ? "status-due" : ""}>{k.last_rotated_on ?? "never"}</td>
                <td><button onClick={() => save("key_register", { name: k.name }, { last_rotated_on: today() })}>Rotated today</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card scroll">
        <h2>Audit log (latest 30)</h2>
        <table>
          <thead><tr><th>When</th><th>Who</th><th>What</th><th>Row</th></tr></thead>
          <tbody>
            {audit.rows.map((a) => (
              <tr key={a.id}>
                <td className="muted">{when(a.at)}</td>
                <td>{a.actor}</td>
                <td>{a.op.toLowerCase()} {a.table_name}</td>
                <td className="muted"><code>{a.row_key?.slice(0, 12)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card scroll">
        <h2>Latest evidence</h2>
        <table>
          <thead><tr><th>Collected</th><th>Control</th><th>Summary</th><th>SHA-256</th></tr></thead>
          <tbody>
            {evidence.rows.map((e) => (
              <tr key={e.id}>
                <td className="muted">{when(e.collected_at)}</td>
                <td>{e.control}</td>
                <td>{e.summary}</td>
                <td className="muted"><code>{e.sha256.slice(0, 12)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
