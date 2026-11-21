/**
 * The worker: one long-running process that wakes every minute, runs any agent
 * that is due, works through queued tasks, and sends approved emails.
 *
 *   npm run worker            run forever
 *   npm run agent -- ceo      run one agent once (ceo | research | sales | send)
 */
import { db, logEvent, type AgentRow } from "./lib/db.js";
import { sendApprovedEmails } from "./lib/mailer.js";
import { runCeo, runNextTask } from "./agents/index.js";

const TICK_MS = 60_000;

function isDue(agent: AgentRow): boolean {
  if (!agent.last_run_at) return true;
  return Date.now() - new Date(agent.last_run_at).getTime() >= agent.schedule_minutes * 60_000;
}

let running = false;

async function tick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const { data: agents } = await db().from("agents").select("*");
    const ceo = (agents ?? []).find((a) => a.name === "ceo") as AgentRow | undefined;
    if (ceo && ceo.enabled && isDue(ceo)) await runCeo();

    // Work through up to 3 tasks per agent per tick, so one agent can't starve the others.
    for (const name of ["research", "sales"] as const) {
      for (let i = 0; i < 3; i++) {
        if (!(await runNextTask(name))) break;
      }
    }

    await sendApprovedEmails();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("tick failed:", message);
    await logEvent("worker", `Worker error: ${message}`, "error").catch(() => {});
  } finally {
    running = false;
  }
}

async function main() {
  const [, , mode, arg] = process.argv;
  if (mode === "once") {
    switch (arg) {
      case "ceo":
        console.log(await runCeo());
        break;
      case "research":
      case "sales":
        console.log((await runNextTask(arg)) ? "ran one task" : "no queued task");
        break;
      case "send":
        console.log(`sent ${await sendApprovedEmails()}`);
        break;
      default:
        console.error("usage: npm run agent -- <ceo|research|sales|send>");
        process.exit(1);
    }
    return;
  }

  await logEvent("worker", "Worker started");
  await tick();
  setInterval(tick, TICK_MS);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
