import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { db, getSetting } from "../lib/db.js";

const run = promisify(execFile);

export type Severity = "critical" | "high" | "medium" | "low";
export type CheckResult = {
  id: string;
  title: string;
  severity: Severity;
  ok: boolean;
  detail: string;
  evidence?: unknown;
};

const fail = (id: string, title: string, severity: Severity, detail: string, evidence?: unknown): CheckResult => ({
  id, title, severity, ok: false, detail, evidence,
});
const pass = (id: string, title: string, severity: Severity, detail = "ok", evidence?: unknown): CheckResult => ({
  id, title, severity, ok: true, detail, evidence,
});

/** Policies the migrations create. Anything else is a change someone must explain. */
const EXPECTED_POLICIES = new Set(["owner_all", "owner_read"]);

type RlsRow = { table: string; rls: boolean; policies: { name: string; roles: string[]; cmd: string }[] };

export async function checkRls(): Promise<CheckResult[]> {
  const { data, error } = await db().rpc("security_rls_report");
  if (error) return [fail("rls_report", "Database access rules readable", "high", error.message)];
  const rows = (data ?? []) as RlsRow[];
  const noRls = rows.filter((r) => !r.rls).map((r) => r.table);
  const open = rows.flatMap((r) =>
    r.policies
      .filter((p) => p.roles.some((role) => role === "anon" || role === "public"))
      .map((p) => `${r.table}.${p.name}`),
  );
  const unexpected = rows.flatMap((r) =>
    r.policies.filter((p) => !EXPECTED_POLICIES.has(p.name)).map((p) => `${r.table}.${p.name}`),
  );
  return [
    noRls.length
      ? fail("rls_enabled", "Row-level security on every table", "critical", `RLS is off on: ${noRls.join(", ")}`, rows)
      : pass("rls_enabled", "Row-level security on every table", "critical", `${rows.length} tables checked`, rows),
    open.length
      ? fail("rls_no_public", "No access rules for signed-out users", "critical", `Public policies: ${open.join(", ")}`)
      : pass("rls_no_public", "No access rules for signed-out users", "critical"),
    unexpected.length
      ? fail("rls_expected", "Only the expected access rules exist", "high", `Unexpected policies: ${unexpected.join(", ")}`)
      : pass("rls_expected", "Only the expected access rules exist", "high"),
  ];
}

type AuthReport = {
  owners: string[];
  non_owner_users: string[];
  owners_without_mfa: string[];
  sessions_last_24h: number;
};

export async function checkAuth(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const { data, error } = await db().rpc("security_auth_report");
  if (error) return [fail("auth_report", "Sign-in settings readable", "high", error.message)];
  const r = data as AuthReport;

  results.push(
    r.owners.length === 0
      ? fail("owner_set", "An owner is set", "high", "app_owner is empty, so nobody can use the dashboard.")
      : pass("owner_set", "An owner is set", "high", `${r.owners.length} owner(s)`),
    r.non_owner_users.length
      ? fail("no_extra_users", "No sign-in accounts besides the owner", "high", `Unexpected accounts: ${r.non_owner_users.join(", ")}`)
      : pass("no_extra_users", "No sign-in accounts besides the owner", "high"),
    r.owners_without_mfa.length
      ? fail("owner_mfa", "Owner has MFA set up", "high", `No verified authenticator for: ${r.owners_without_mfa.join(", ")}`)
      : pass("owner_mfa", "Owner has MFA set up", "high"),
    r.sessions_last_24h > 5
      ? fail("session_volume", "Normal number of new sign-ins", "medium", `${r.sessions_last_24h} new sessions in 24 hours`)
      : pass("session_volume", "Normal number of new sign-ins", "medium", `${r.sessions_last_24h} new sessions in 24 hours`),
  );

  // Public auth settings: tells us whether sign-ups are open at the API, not just on the login page.
  const url = process.env.SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } });
      const s = (await res.json()) as { disable_signup?: boolean };
      results.push(
        s.disable_signup === true
          ? pass("signups_off", "Public sign-ups disabled", "medium")
          : fail("signups_off", "Public sign-ups disabled", "medium", "Turn off sign-ups under Authentication > Sign In / Providers."),
      );
    } catch (err) {
      results.push(fail("signups_off", "Public sign-ups disabled", "low", `Could not read auth settings: ${String(err)}`));
    }
  }
  return results;
}

function jwtRole(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null; // new-style keys (sb_publishable_ / sb_secret_) are not JWTs
  }
}

export async function checkKeys(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const leaked =
    (anon && (jwtRole(anon) === "service_role" || anon.startsWith("sb_secret_") || anon === process.env.SUPABASE_SERVICE_ROLE_KEY));
  results.push(
    leaked
      ? fail("public_key_safe", "Browser key is not the service key", "critical", "NEXT_PUBLIC_SUPABASE_ANON_KEY holds the service role key. Rotate it now.")
      : pass("public_key_safe", "Browser key is not the service key", "critical"),
  );

  const { data, error } = await db().from("key_register").select("*");
  if (error) return [...results, fail("key_register", "Key register readable", "medium", error.message)];
  const today = Date.now();
  const due = (data ?? []).filter((k) => {
    if (k.name === "GITHUB_TOKEN" && !process.env.GITHUB_TOKEN) return false;
    if (k.name === "SMTP_PASS" && !process.env.SMTP_PASS) return false;
    if (!k.last_rotated_on) return true;
    return today - new Date(k.last_rotated_on).getTime() > k.rotate_every_days * 86_400_000;
  });
  results.push(
    due.length
      ? fail("key_rotation", "Keys rotated on schedule", "medium",
          `Due or never recorded: ${due.map((k) => k.name).join(", ")}. Rotate, then mark them on the Security page.`)
      : pass("key_rotation", "Keys rotated on schedule", "medium"),
  );
  return results;
}

export async function checkDependencies(): Promise<CheckResult[]> {
  try {
    const { stdout } = await run("npm", ["audit", "--omit=dev", "--json"], { cwd: process.cwd(), maxBuffer: 10_000_000 })
      .catch((e: { stdout?: string }) => ({ stdout: e.stdout ?? "{}" })); // npm audit exits 1 when it finds issues
    const report = JSON.parse(stdout) as { metadata?: { vulnerabilities?: Record<string, number> } };
    const v = report.metadata?.vulnerabilities ?? {};
    const serious = (v.high ?? 0) + (v.critical ?? 0);
    return [
      serious
        ? fail("dependencies", "No high or critical package advisories", (v.critical ?? 0) ? "high" : "medium",
            `${v.critical ?? 0} critical, ${v.high ?? 0} high. Run npm audit for details.`, v)
        : pass("dependencies", "No high or critical package advisories", "medium", `moderate ${v.moderate ?? 0}, low ${v.low ?? 0}`, v),
    ];
  } catch (err) {
    return [fail("dependencies", "No high or critical package advisories", "low", `npm audit failed: ${String(err)}`)];
  }
}

export async function checkAuditLog(): Promise<CheckResult[]> {
  const { data, error } = await db().rpc("audit_log_verify");
  if (error) return [fail("audit_chain", "Audit log intact", "high", error.message)];
  return [
    data
      ? fail("audit_chain", "Audit log intact", "critical", `Audit log hash chain breaks at row ${data}. Someone edited or removed history.`)
      : pass("audit_chain", "Audit log intact", "critical"),
  ];
}

export async function checkActivity(): Promise<CheckResult[]> {
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const since = dayStart.toISOString();
  const [agents, spend, sent, errors] = await Promise.all([
    db().from("agents").select("name, daily_budget_usd"),
    db().from("spend").select("usd").gte("created_at", since),
    db().from("approvals").select("id", { count: "exact", head: true }).eq("status", "sent").gte("sent_at", since),
    db().from("events").select("id", { count: "exact", head: true }).eq("level", "error")
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString()),
  ]);
  const budget = (agents.data ?? []).reduce((s, a) => s + Number(a.daily_budget_usd), 0);
  const spent = (spend.data ?? []).reduce((s, r) => s + Number(r.usd), 0);
  const cap = Number(await getSetting<number>("daily_send_cap", 40));
  return [
    spent > budget * 1.1
      ? fail("spend_spike", "AI spend within budgets", "high", `$${spent.toFixed(2)} spent today against $${budget.toFixed(2)} of budgets`)
      : pass("spend_spike", "AI spend within budgets", "high", `$${spent.toFixed(2)} of $${budget.toFixed(2)}`),
    (sent.count ?? 0) > cap
      ? fail("send_spike", "Emails sent within the daily cap", "critical", `${sent.count} sent today, cap is ${cap}`)
      : pass("send_spike", "Emails sent within the daily cap", "critical", `${sent.count ?? 0} of ${cap}`),
    (errors.count ?? 0) > 20
      ? fail("error_rate", "Normal error rate", "low", `${errors.count} errors in 24 hours`)
      : pass("error_rate", "Normal error rate", "low", `${errors.count ?? 0} errors in 24 hours`),
  ];
}

/** Checks the live dashboard sends the security headers. Needs DASHBOARD_URL. */
export async function checkHeaders(): Promise<CheckResult[]> {
  const url = process.env.DASHBOARD_URL;
  if (!url) return [];
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/login`, { redirect: "manual" });
    const want = ["content-security-policy", "strict-transport-security", "x-content-type-options", "referrer-policy"];
    const missing = want.filter((h) => !res.headers.get(h));
    const frames = res.headers.get("content-security-policy")?.includes("frame-ancestors 'none'");
    return [
      missing.length || !frames
        ? fail("headers", "Dashboard sends security headers", "medium", `Missing: ${[...missing, ...(frames ? [] : ["frame-ancestors"])].join(", ")}`)
        : pass("headers", "Dashboard sends security headers", "medium"),
    ];
  } catch (err) {
    return [fail("headers", "Dashboard sends security headers", "low", `Could not reach ${url}: ${String(err)}`)];
  }
}

/** Reads CI and Dependabot status from GitHub. Needs GITHUB_TOKEN (read-only) and GITHUB_REPO (owner/name). */
export async function checkGitHub(): Promise<CheckResult[]> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) return [];
  const gh = (path: string) =>
    fetch(`https://api.github.com/repos/${repo}${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json" },
    });
  const results: CheckResult[] = [];
  try {
    const runs = (await (await gh("/actions/workflows/security.yml/runs?branch=main&per_page=1")).json()) as {
      workflow_runs?: { conclusion: string | null; html_url: string }[];
    };
    const last = runs.workflow_runs?.[0];
    results.push(
      last?.conclusion === "success"
        ? pass("ci_security", "Security checks pass on main", "high", last.html_url)
        : fail("ci_security", "Security checks pass on main", "high", last ? `Last run: ${last.conclusion ?? "running"} ${last.html_url}` : "No security run found on main"),
    );
    const alerts = await gh("/dependabot/alerts?state=open&per_page=100");
    if (alerts.ok) {
      const list = (await alerts.json()) as { security_advisory: { severity: string } }[];
      const serious = list.filter((a) => ["high", "critical"].includes(a.security_advisory.severity)).length;
      results.push(
        serious
          ? fail("dependabot", "No open high Dependabot alerts", "medium", `${serious} high or critical alerts open`)
          : pass("dependabot", "No open high Dependabot alerts", "medium", `${list.length} open in total`),
      );
    }
  } catch (err) {
    results.push(fail("ci_security", "Security checks pass on main", "low", `GitHub not reachable: ${String(err)}`));
  }
  return results;
}

export async function runAllChecks(): Promise<CheckResult[]> {
  const groups = await Promise.all([
    checkRls(), checkAuth(), checkKeys(), checkDependencies(), checkAuditLog(), checkActivity(), checkHeaders(), checkGitHub(),
  ].map((p) => p.catch((err) => [fail("check_crashed", "Security check ran", "medium", String(err))])));
  return groups.flat();
}
