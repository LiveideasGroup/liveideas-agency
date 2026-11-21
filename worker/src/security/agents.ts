import { createHash } from "node:crypto";
import { db, engageKillSwitch, isKillSwitchOn, logEvent } from "../lib/db.js";
import { loadAgent, quickCall } from "../lib/runAgent.js";
import { runAllChecks, type CheckResult } from "./checks.js";

const sha256 = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");

/**
 * Security agent. Runs every check in plain code, keeps security_findings in step
 * (opens new ones, resolves fixed ones), turns the kill switch on for a new critical
 * finding, and asks Haiku for a short summary only when something changed.
 * It reports and can pause; it never changes code, keys or permissions.
 */
export async function runSecurity(): Promise<string> {
  const agent = await loadAgent("security");
  if (!agent.enabled) return "security agent is switched off";

  const results = await runAllChecks();
  const failing = results.filter((r) => !r.ok);
  const { data: open } = await db().from("security_findings").select("id, check_id").eq("status", "open");
  const openIds = new Set((open ?? []).map((f) => f.check_id));
  const now = new Date().toISOString();

  const opened: CheckResult[] = [];
  for (const r of failing) {
    if (openIds.has(r.id)) {
      await db().from("security_findings").update({ last_seen: now, detail: r.detail, severity: r.severity })
        .eq("check_id", r.id).eq("status", "open");
    } else {
      // An 'accepted' finding stays accepted while it keeps failing for the same reason.
      const { data: accepted } = await db().from("security_findings").select("id").eq("check_id", r.id)
        .eq("status", "accepted").eq("detail", r.detail).limit(1);
      if (accepted?.length) continue;
      await db().from("security_findings").insert({ check_id: r.id, severity: r.severity, title: r.title, detail: r.detail });
      opened.push(r);
    }
  }
  const passingIds = results.filter((r) => r.ok).map((r) => r.id);
  const resolved = (open ?? []).filter((f) => passingIds.includes(f.check_id));
  if (resolved.length) {
    await db().from("security_findings").update({ status: "resolved", resolved_at: now })
      .in("id", resolved.map((f) => f.id));
  }

  await db().from("compliance_evidence").insert({
    control: "security_checks",
    summary: `${results.length} checks, ${failing.length} failing`,
    data: results,
    sha256: sha256(results),
  });

  const critical = opened.filter((r) => r.severity === "critical");
  if (critical.length && !(await isKillSwitchOn())) {
    await engageKillSwitch("security", critical.map((r) => r.title).join("; "));
  }

  let summary = `Security checks: ${results.length - failing.length} of ${results.length} passing.`;
  if (opened.length) summary += ` New: ${opened.map((r) => `${r.title} (${r.severity})`).join(", ")}.`;
  if (resolved.length) summary += ` Fixed: ${resolved.length}.`;

  if (opened.length || resolved.length) {
    const ai = await quickCall(
      "security",
      "You write a 2 to 4 sentence security update for a non-technical business owner. Plain words, most urgent first, say exactly what to do next. No preamble.",
      `Newly failing checks:\n${opened.map((r) => `- [${r.severity}] ${r.title}: ${r.detail}`).join("\n") || "none"}\n\n` +
        `Still failing:\n${failing.filter((r) => !opened.includes(r)).map((r) => `- [${r.severity}] ${r.title}`).join("\n") || "none"}\n\n` +
        `Fixed since last run: ${resolved.length}`,
      400,
    ).catch(() => null);
    if (ai?.text) summary = ai.text;
  }

  await logEvent("security", summary, failing.some((r) => ["critical", "high"].includes(r.severity)) ? "warn" : "info");
  await db().from("agents").update({ last_run_at: now }).eq("name", "security");
  return summary;
}

/**
 * Compliance agent. Weekly, code only: snapshots evidence for each control area,
 * applies the data retention rules, and reports recurring controls that are overdue.
 */
export async function runCompliance(): Promise<string> {
  const agent = await loadAgent("compliance");
  if (!agent.enabled) return "compliance agent is switched off";

  const snap = async (control: string, summary: string, data: unknown) => {
    await db().from("compliance_evidence").insert({ control, summary, data, sha256: sha256(data) });
  };

  const [rls, auth, keys, agents, settings, audit, findings] = await Promise.all([
    db().rpc("security_rls_report"),
    db().rpc("security_auth_report"),
    db().from("key_register").select("*"),
    db().from("agents").select("name, enabled, model, daily_budget_usd"),
    db().from("settings").select("key, value"),
    db().rpc("audit_log_verify"),
    db().from("security_findings").select("check_id, severity, status, first_seen, resolved_at")
      .gte("first_seen", new Date(Date.now() - 7 * 86_400_000).toISOString()),
  ]);

  await snap("CC6.1 logical access", "Row-level security and policies on every table", rls.data ?? rls.error);
  await snap("CC6.2 user accounts", "Owners, other accounts, MFA status, recent sessions", auth.data ?? auth.error);
  await snap("CC6.1 key management", "Key register with rotation dates", keys.data ?? keys.error);
  await snap("CC8.1 configuration", "Agent settings, budgets and global switches", { agents: agents.data, settings: settings.data });
  await snap("CC7.2 audit log", audit.data ? `Chain broken at row ${audit.data}` : "Audit chain intact", { broken_at: audit.data ?? null });
  await snap("CC7.3 findings", "Security findings opened or resolved in the last 7 days", findings.data ?? []);

  const retention = await db().rpc("apply_retention");
  await snap("C1.2 retention", "Data retention applied", retention.data ?? retention.error);

  const { data: controls } = await db().from("controls").select("*");
  const overdue = (controls ?? []).filter(
    (c) => !c.last_done_on || Date.now() - new Date(c.last_done_on).getTime() > c.every_days * 86_400_000,
  );
  await snap("CC4.1 recurring controls", `${overdue.length} overdue`, controls ?? []);

  const now = new Date().toISOString();
  await db().from("agents").update({ last_run_at: now }).eq("name", "compliance");
  const summary =
    `Weekly compliance snapshot saved (8 evidence items).` +
    (overdue.length ? ` Due for you: ${overdue.map((c) => c.title).join("; ")}. Mark each done on the Security page.` : " No recurring controls overdue.");
  await logEvent("compliance", summary, overdue.length ? "warn" : "info");
  return summary;
}
