import type Anthropic from "@anthropic-ai/sdk";
import { db } from "./db.js";

/** USD per million tokens. Keep in step with https://platform.claude.com pricing. */
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.1, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export function costUsd(model: string, usage: Anthropic.Beta.BetaUsage): number {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  const m = 1_000_000;
  return (
    (usage.input_tokens * p.input) / m +
    (usage.output_tokens * p.output) / m +
    ((usage.cache_read_input_tokens ?? 0) * p.cacheRead) / m +
    ((usage.cache_creation_input_tokens ?? 0) * p.cacheWrite) / m
  );
}

export async function recordSpend(agent: string, model: string, usage: Anthropic.Beta.BetaUsage): Promise<number> {
  const usd = costUsd(model, usage);
  const { error } = await db().from("spend").insert({
    agent,
    model,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    cache_write_tokens: usage.cache_creation_input_tokens ?? 0,
    usd,
  });
  if (error) console.error(`[${agent}] failed to record spend:`, error.message);
  return usd;
}

/** Spend so far today (UTC) for one agent. */
export async function spentToday(agent: string): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { data, error } = await db()
    .from("spend")
    .select("usd")
    .eq("agent", agent)
    .gte("created_at", start.toISOString());
  if (error) throw new Error(`could not read spend: ${error.message}`);
  return (data ?? []).reduce((sum, r) => sum + Number(r.usd), 0);
}
