import Anthropic from "@anthropic-ai/sdk";
import { db, getSetting, logEvent, type AgentRow } from "./db.js";
import { recordSpend, spentToday } from "./cost.js";

const anthropic = new Anthropic();

type RunnerParams = Parameters<typeof anthropic.beta.messages.toolRunner>[0];

export type AgentRunOptions = {
  agent: string;
  system: string;
  prompt: string;
  tools: RunnerParams["tools"];
  maxIterations?: number;
};

export type AgentRunResult = {
  status: "done" | "skipped" | "stopped" | "refused";
  text: string;
  usd: number;
};

export async function loadAgent(name: string): Promise<AgentRow> {
  const { data, error } = await db().from("agents").select("*").eq("name", name).single();
  if (error || !data) throw new Error(`agent ${name} not found: ${error?.message}`);
  return data as AgentRow;
}

/** Why an agent may not run right now, or null when it may. */
export async function blockedReason(agent: AgentRow): Promise<string | null> {
  if (await getSetting<boolean>("kill_switch", false)) return "kill switch is on";
  if (!agent.enabled) return "agent is switched off";
  const spent = await spentToday(agent.name);
  const cap = Number(agent.daily_budget_usd);
  if (spent >= cap) return `daily budget reached ($${spent.toFixed(2)} of $${cap.toFixed(2)})`;
  return null;
}

/**
 * Runs one agent turn with the SDK tool runner. Checks the kill switch and the
 * daily budget before the run and after every model call, and records spend.
 */
export async function runAgent(opts: AgentRunOptions): Promise<AgentRunResult> {
  const agent = await loadAgent(opts.agent);
  const blocked = await blockedReason(agent);
  if (blocked) {
    await logEvent(agent.name, `Skipped run: ${blocked}`, "warn");
    return { status: "skipped", text: blocked, usd: 0 };
  }

  const runner = anthropic.beta.messages.toolRunner({
    model: agent.model,
    max_tokens: 16000,
    max_iterations: opts.maxIterations ?? 25,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: agent.effort },
    cache_control: { type: "ephemeral" },
    system: opts.system,
    tools: opts.tools,
    messages: [{ role: "user", content: opts.prompt }],
  });

  let usd = 0;
  let last: Anthropic.Beta.BetaMessage | null = null;
  for await (const message of runner) {
    last = message;
    usd += await recordSpend(agent.name, message.model ?? agent.model, message.usage);

    if (message.stop_reason === "refusal") {
      await logEvent(agent.name, "The model declined this request", "warn", message.stop_details ?? null);
      return { status: "refused", text: "", usd };
    }
    if (message.stop_reason === "tool_use") {
      const blockedNow = await blockedReason(agent);
      if (blockedNow) {
        await logEvent(agent.name, `Stopped mid-run: ${blockedNow}`, "warn");
        return { status: "stopped", text: textOf(message), usd };
      }
    }
  }

  await db().from("agents").update({ last_run_at: new Date().toISOString() }).eq("name", agent.name);
  return { status: "done", text: last ? textOf(last) : "", usd };
}

function textOf(message: Anthropic.Beta.BetaMessage): string {
  return message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
