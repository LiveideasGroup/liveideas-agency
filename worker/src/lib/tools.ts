import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { db, logEvent } from "./db.js";
import { NICHE_IDS, type NicheId } from "../niches.js";
import { guardDraft } from "../security/guard.js";

const nicheEnum = z.enum(NICHE_IDS as [NicheId, ...NicheId[]]);

/** Server tools that run on Anthropic's side: no run function needed. */
export const webTools = [
  { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 15 },
  { type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 15 },
];

export function logTool(agent: string) {
  return betaZodTool({
    name: "log_progress",
    description:
      "Post a one-line update to the owner's live activity feed. Use it for meaningful steps, not every action.",
    inputSchema: z.object({ message: z.string().max(300) }),
    run: async ({ message }) => {
      await logEvent(agent, message);
      return "logged";
    },
  });
}

export function createTaskTool(createdBy: string) {
  return betaZodTool({
    name: "create_task",
    description:
      "Queue a task for another agent. Agents: 'research' (find and save new leads for a niche), 'sales' (draft first-touch outreach for saved leads in a niche).",
    inputSchema: z.object({
      agent: z.enum(["research", "sales"]),
      niche: nicheEnum,
      kind: z.string().describe("Short label, e.g. find_leads or draft_outreach"),
      instructions: z.string().describe("What to do, how many, and anything to focus on"),
    }),
    run: async (input) => {
      const { error } = await db().from("tasks").insert({ ...input, created_by: createdBy });
      if (error) return `error: ${error.message}`;
      await logEvent(createdBy, `Queued ${input.kind} for ${input.agent} (${input.niche})`);
      return "queued";
    },
  });
}

export const listLeadsTool = betaZodTool({
  name: "list_leads",
  description:
    "List saved leads, optionally filtered by niche and status. Use before saving new leads to avoid duplicates.",
  inputSchema: z.object({
    niche: nicheEnum.optional(),
    status: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(50),
  }),
  run: async ({ niche, status, limit }) => {
    let q = db()
      .from("leads")
      .select("id, niche, company, website, contact_name, contact_role, email, reason, status")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (niche) q = q.eq("niche", niche);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) return `error: ${error.message}`;
    return JSON.stringify(data ?? []);
  },
});

export const saveLeadTool = betaZodTool({
  name: "save_lead",
  description:
    "Save one prospect company. Only use a business email that the company publishes itself (website, contact page) or that is a role address. Never guess or construct an email address.",
  inputSchema: z.object({
    niche: nicheEnum,
    company: z.string(),
    website: z.string().url().regex(/^https?:\/\//i, "must be an http(s) link"),
    contact_name: z.string().optional(),
    contact_role: z.string().optional(),
    email: z.string().email().optional().describe("Only if published by the company"),
    reason: z.string().describe("One or two sentences: why they fit and the hook for outreach"),
  }),
  run: async (lead) => {
    const { error } = await db().from("leads").insert(lead);
    if (error) {
      if (error.code === "23505") return "already saved (duplicate website for this niche)";
      return `error: ${error.message}`;
    }
    await logEvent("research", `Saved lead: ${lead.company} (${lead.niche})`);
    return "saved";
  },
});

export const draftOutreachTool = betaZodTool({
  name: "draft_outreach",
  description:
    "Submit a first-touch email for the owner to approve. It goes to the lead's saved email only, is checked by the outbound guard, and is NOT sent until the owner approves it in the dashboard.",
  inputSchema: z.object({
    lead_id: z.string().uuid(),
    subject: z.string().max(80),
    body: z.string().max(1500).describe("Plain text. No opt-out line or signature: those are added on send."),
  }),
  run: async ({ lead_id, subject, body }) => {
    const { data: lead } = await db()
      .from("leads")
      .select("company, status, email, website")
      .eq("id", lead_id)
      .maybeSingle();
    if (!lead) return "error: lead not found";
    if (lead.status === "opted_out") return "error: this lead opted out; do not contact";
    if (!lead.email) return "error: this lead has no saved email; skip it";
    const to = lead.email as string;

    const guard = await guardDraft({ to, subject, body }, lead);
    const { error } = await db().from("approvals").insert({
      agent: "sales",
      kind: "email",
      lead_id,
      title: `Email to ${lead.company}: ${subject}`,
      payload: { to, subject, body },
      status: guard.status === "blocked" ? "blocked" : "pending",
      guard_status: guard.status,
      guard_flags: guard.flags,
    });
    if (error) return `error: ${error.message}`;
    if (guard.status === "blocked") {
      await logEvent("guard", `Blocked a draft to ${lead.company}: ${guard.flags.map((f) => f.code).join(", ")}`, "warn", guard.flags);
      return `blocked by the outbound guard: ${guard.flags.map((f) => f.detail).join("; ")}`;
    }
    await db().from("leads").update({ status: "drafted", updated_at: new Date().toISOString() }).eq("id", lead_id);
    await logEvent("sales", `Drafted email to ${lead.company} for approval${guard.status === "flagged" ? " (flagged)" : ""}`);
    return guard.status === "flagged" ? "submitted for approval, with guard flags for the owner" : "submitted for approval";
  },
});

export const metricsTool = betaZodTool({
  name: "get_metrics",
  description:
    "Get current business numbers: leads by niche and status, approvals pending, emails sent, revenue this month, AI spend today, and open tasks.",
  inputSchema: z.object({}),
  run: async () => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);

    const [leads, approvals, revenue, spend, tasks] = await Promise.all([
      db().from("leads").select("niche, status"),
      db().from("approvals").select("status"),
      db().from("revenue").select("niche, kind, amount_gbp").gte("received_on", monthStart.toISOString().slice(0, 10)),
      db().from("spend").select("agent, usd").gte("created_at", dayStart.toISOString()),
      db().from("tasks").select("agent, status").in("status", ["queued", "running"]),
    ]);

    const count = <T,>(rows: T[] | null, key: (r: T) => string) =>
      (rows ?? []).reduce<Record<string, number>>((acc, r) => {
        const k = key(r);
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});

    return JSON.stringify({
      leads_by_niche_status: count(leads.data, (r: { niche: string; status: string }) => `${r.niche}:${r.status}`),
      approvals_by_status: count(approvals.data, (r: { status: string }) => r.status),
      revenue_this_month_gbp: (revenue.data ?? []).reduce((s, r) => s + Number(r.amount_gbp), 0),
      revenue_by_niche: (revenue.data ?? []).reduce<Record<string, number>>((acc, r) => {
        const k = r.niche ?? "unknown";
        acc[k] = (acc[k] ?? 0) + Number(r.amount_gbp);
        return acc;
      }, {}),
      ai_spend_today_usd: (spend.data ?? []).reduce((s, r) => s + Number(r.usd), 0),
      open_tasks: count(tasks.data, (r: { agent: string; status: string }) => `${r.agent}:${r.status}`),
    });
  },
});

export const briefingTool = betaZodTool({
  name: "write_briefing",
  description: "Publish the daily briefing for the owner. Call once at the end of the run.",
  inputSchema: z.object({
    summary: z.string().describe("3 to 6 short sentences: what happened, what is next, any decision the owner must make"),
  }),
  run: async ({ summary }) => {
    await logEvent("ceo", summary, "briefing");
    return "published";
  },
});
