"use client";
import { useState } from "react";
import { useLiveTable } from "@/components/useLiveTable";
import { NICHE_LABELS, when } from "@/lib/format";

type Lead = {
  id: string;
  niche: string;
  company: string;
  website: string | null;
  contact_name: string | null;
  contact_role: string | null;
  email: string | null;
  reason: string | null;
  status: string;
  updated_at: string;
};

const STATUSES = ["new", "drafted", "contacted", "replied", "proof_sent", "pilot_paid", "won", "lost", "opted_out"];

export default function PipelinePage() {
  const [niche, setNiche] = useState("all");
  const { rows, error, sb } = useLiveTable<Lead>("pipeline", ["leads"], (sb) =>
    sb.from("leads").select("*").order("updated_at", { ascending: false }).limit(500),
  );
  const shown = niche === "all" ? rows : rows.filter((r) => r.niche === niche);

  async function setStatus(id: string, status: string) {
    const { error } = await sb.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) alert(error.message);
  }

  return (
    <main>
      <h1>Pipeline</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <select value={niche} onChange={(e) => setNiche(e.target.value)} style={{ width: "auto" }} aria-label="Niche">
          <option value="all">All niches</option>
          {Object.entries(NICHE_LABELS).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <span className="muted">
          {STATUSES.map((s) => `${s.replace("_", " ")} ${shown.filter((r) => r.status === s).length}`).join(" · ")}
        </span>
      </div>
      {error && <p className="error">{error}</p>}
      <section className="card scroll">
        <table>
          <thead>
            <tr><th>Company</th><th>Niche</th><th>Contact</th><th>Why them</th><th>Status</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id}>
                <td>{l.website ? <a href={l.website} target="_blank" rel="noreferrer">{l.company}</a> : l.company}</td>
                <td>{NICHE_LABELS[l.niche] ?? l.niche}</td>
                <td>
                  {[l.contact_name, l.contact_role].filter(Boolean).join(", ") || <span className="muted">none</span>}
                  {l.email && <div className="muted">{l.email}</div>}
                </td>
                <td style={{ maxWidth: 320 }}>{l.reason}</td>
                <td>
                  <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} aria-label="Status">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </td>
                <td className="muted">{when(l.updated_at)}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={6} className="muted">No leads yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
