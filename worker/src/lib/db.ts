import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Service-role client for agents. Never ship this key to the browser. */
export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the worker");
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export type AgentRow = {
  name: string;
  title: string;
  enabled: boolean;
  model: string;
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  daily_budget_usd: number;
  schedule_minutes: number;
  last_run_at: string | null;
};

export async function logEvent(
  agent: string,
  message: string,
  level: "info" | "warn" | "error" | "briefing" = "info",
  data?: unknown,
) {
  const { error } = await db().from("events").insert({ agent, message, level, data: data ?? null });
  if (error) console.error(`[${agent}] failed to log event:`, error.message);
  console.log(`[${agent}] ${level}: ${message}`);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await db().from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? fallback;
}
