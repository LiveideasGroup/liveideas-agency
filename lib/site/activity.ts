/**
 * The public activity feed. The database function `public_activity` returns only
 * agent, task kind, niche, status and time: never company names, people or messages.
 * Known task kinds are turned into fixed phrases here; anything else becomes a generic line.
 */
import { createClient } from "@supabase/supabase-js";

export type FeedItem = { id: string; agent: string; text: string; niche: string | null; status: "done" | "running"; at: string };
export type Feed = { live: boolean; items: FeedItem[]; stats: { tasksDone7d: number; leadsFound7d: number; repliesSent7d: number } | null };

const NICHE_LABEL: Record<string, string> = {
  forex: "forex and prop firms",
  product: "product teams",
  manual_testing: "QA teams",
};

const PHRASES: Record<string, { done: string; running: string }> = {
  find_leads: { done: "Finished market research", running: "Researching the market" },
  research: { done: "Finished market research", running: "Researching the market" },
  draft_outreach: { done: "Drafted written proposals for review", running: "Drafting written proposals" },
  inbound_reply: { done: "Replied to a website enquiry", running: "Answering a website enquiry" },
  daily_review: { done: "Published the daily plan", running: "Reviewing today's numbers" },
  security_scan: { done: "Passed the daily security checks", running: "Running security checks" },
  build_proof: { done: "Built a free proof", running: "Building a free proof" },
  qa_run: { done: "Finished a test run", running: "Running tests" },
};

type Row = { id: string; agent: string; kind: string; niche: string | null; status: string; at: string };

export function describe(row: Row): FeedItem {
  const status = row.status === "running" ? "running" : "done";
  const phrase = PHRASES[row.kind]?.[status] ?? (status === "running" ? "Working on a task" : "Finished a task");
  const niche = row.niche && NICHE_LABEL[row.niche] ? ` for ${NICHE_LABEL[row.niche]}` : "";
  return { id: row.id, agent: row.agent, text: phrase + niche, niche: row.niche, status, at: row.at };
}

/** Shown when the live feed is off or not set up yet, and labelled as an example on the page. */
export function sampleFeed(now = Date.now()): Feed {
  const rows: Omit<Row, "at">[] = [
    { id: "s1", agent: "ceo", kind: "daily_review", niche: null, status: "done" },
    { id: "s2", agent: "research", kind: "find_leads", niche: "forex", status: "done" },
    { id: "s3", agent: "sales", kind: "inbound_reply", niche: "product", status: "done" },
    { id: "s4", agent: "security", kind: "security_scan", niche: null, status: "done" },
    { id: "s5", agent: "delivery", kind: "build_proof", niche: "manual_testing", status: "done" },
    { id: "s6", agent: "qa", kind: "qa_run", niche: "manual_testing", status: "running" },
  ];
  const step = 4 * 60_000;
  return {
    live: false,
    stats: null,
    items: rows.map((r, i) => describe({ ...r, at: new Date(now - (rows.length - i) * step).toISOString() })).reverse(),
  };
}

export async function getFeed(): Promise<Feed> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("example.supabase.co")) return sampleFeed();
  try {
    const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await sb.rpc("public_activity");
    if (error || !data || data.enabled === false) return sampleFeed();
    const items = ((data.items ?? []) as Row[]).map(describe);
    if (items.length === 0) return sampleFeed();
    const s = data.stats ?? {};
    return {
      live: true,
      items,
      stats: { tasksDone7d: Number(s.tasks_done_7d ?? 0), leadsFound7d: Number(s.leads_found_7d ?? 0), repliesSent7d: Number(s.emails_sent_7d ?? 0) },
    };
  } catch {
    return sampleFeed();
  }
}
