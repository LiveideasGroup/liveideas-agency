"use client";
import { useState } from "react";
import { useLiveTable } from "@/components/useLiveTable";
import { when } from "@/lib/format";

type Approval = {
  id: string;
  agent: string;
  kind: string;
  title: string;
  payload: { to?: string; subject?: string; body?: string };
  status: string;
  guard_status: "unchecked" | "passed" | "flagged" | "blocked";
  guard_flags: { code: string; severity: string; detail: string }[];
  created_at: string;
};

export default function ApprovalsPage() {
  const { rows, error, loading, sb } = useLiveTable<Approval>("approvals", ["approvals"], (sb) =>
    sb.from("approvals").select("*").eq("status", "pending").order("created_at", { ascending: true }).limit(100),
  );

  async function decide(item: Approval, status: "approved" | "rejected", payload?: Approval["payload"]) {
    const { error } = await sb
      .from("approvals")
      .update({ status, decided_at: new Date().toISOString(), ...(payload ? { payload } : {}) })
      .eq("id", item.id)
      .eq("status", "pending");
    if (error) alert(error.message);
  }

  return (
    <main>
      <h1>Approvals</h1>
      <p className="muted">
        Nothing leaves the company until you approve it here. Each email is checked by the outbound guard first; read
        flagged ones closely. There is no bulk approve, so every email gets a look.
      </p>
      {error && <p className="error">{error}</p>}
      {!loading && rows.length === 0 && <p className="card">All clear. Nothing waiting for you.</p>}
      {rows.map((item) => (
        <ApprovalCard key={item.id} item={item} onDecide={decide} />
      ))}
    </main>
  );
}

function ApprovalCard({
  item,
  onDecide,
}: {
  item: Approval;
  onDecide: (item: Approval, status: "approved" | "rejected", payload?: Approval["payload"]) => Promise<void>;
}) {
  const [subject, setSubject] = useState(item.payload.subject ?? "");
  const [body, setBody] = useState(item.payload.body ?? "");
  const [busy, setBusy] = useState(false);
  const edited = subject !== (item.payload.subject ?? "") || body !== (item.payload.body ?? "");

  const flagged = item.guard_status === "flagged" || item.guard_status === "unchecked";

  async function act(status: "approved" | "rejected") {
    if (status === "approved" && flagged && !confirm("The outbound guard flagged this email. Approve it anyway?")) return;
    setBusy(true);
    await onDecide(item, status, status === "approved" && edited ? { ...item.payload, subject, body } : undefined);
    setBusy(false);
  }

  return (
    <section className="card">
      <div className="row">
        <span className="tag">{item.agent}</span>
        <span className="tag">{item.kind}</span>
        <span className={`tag ${flagged ? "warn" : ""}`}>guard: {item.guard_status}</span>
        <span className="muted">{when(item.created_at)}</span>
      </div>
      {item.guard_flags?.length > 0 && (
        <ul className="flags">
          {item.guard_flags.map((f, i) => (
            <li key={i}><strong>{f.code.replace(/_/g, " ")}</strong>: {f.detail}</li>
          ))}
        </ul>
      )}
      <h2 style={{ marginTop: 8 }}>{item.title}</h2>
      {item.payload.to && <p className="muted">To: {item.payload.to}</p>}
      <div style={{ display: "grid", gap: 8 }}>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Body" />
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="primary" disabled={busy} onClick={() => act("approved")}>
          {edited ? "Approve with edits" : flagged ? "Approve anyway" : "Approve"}
        </button>
        <button className="danger" disabled={busy} onClick={() => act("rejected")}>Reject</button>
      </div>
    </section>
  );
}
