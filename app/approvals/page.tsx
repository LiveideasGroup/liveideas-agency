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

  async function approveAll() {
    if (!confirm(`Approve all ${rows.length} pending items as they are?`)) return;
    const { error } = await sb
      .from("approvals")
      .update({ status: "approved", decided_at: new Date().toISOString() })
      .in("id", rows.map((r) => r.id))
      .eq("status", "pending");
    if (error) alert(error.message);
  }

  return (
    <main>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1>Approvals</h1>
        {rows.length > 1 && <button onClick={approveAll}>Approve all {rows.length}</button>}
      </div>
      <p className="muted">Nothing leaves the company until you approve it here. Edit the text first if you like.</p>
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

  async function act(status: "approved" | "rejected") {
    setBusy(true);
    await onDecide(item, status, status === "approved" && edited ? { ...item.payload, subject, body } : undefined);
    setBusy(false);
  }

  return (
    <section className="card">
      <div className="row">
        <span className="tag">{item.agent}</span>
        <span className="tag">{item.kind}</span>
        <span className="muted">{when(item.created_at)}</span>
      </div>
      <h2 style={{ marginTop: 8 }}>{item.title}</h2>
      {item.payload.to && <p className="muted">To: {item.payload.to}</p>}
      <div style={{ display: "grid", gap: 8 }}>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Body" />
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="primary" disabled={busy} onClick={() => act("approved")}>
          {edited ? "Approve with edits" : "Approve"}
        </button>
        <button className="danger" disabled={busy} onClick={() => act("rejected")}>Reject</button>
      </div>
    </section>
  );
}
