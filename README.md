# LiveIdeas agency

An AI consultancy run by AI agents, with one human owner who approves anything that leaves the company.

This is Phase 1 of the approved plan: the **sales MVP**.

- **CEO agent** reviews the numbers once a day, queues work for the other agents and writes a briefing.
- **Research agent** finds companies in the three niches (manual testing, forex businesses, product teams) and saves them as leads with a reason to contact each one.
- **Sales agent** drafts short first-touch emails that offer a free proof. No calls, ever.
- **Approvals queue**: nothing is sent until the owner approves it in the dashboard.
- **Live dashboard** (Next.js): overview, niche race, CEO briefing, activity feed, approvals, pipeline, agent controls, daily AI budgets and a kill switch.

## How it fits together

```
Dashboard (Next.js on Vercel)  <-- live updates -->  Supabase (Postgres + Realtime)
                                                          ^
                                                          | read tasks, write results
                                                          v
                                   Worker (Node, one small server): CEO, Research, Sales
                                                          |
                                     Claude API (web search, web fetch), SMTP for approved emails
```

- `supabase/migrations/0001_init.sql`: the shared board (agents, tasks, leads, approvals, events, spend, revenue, settings) with owner-only row-level security.
- `worker/src/`: the agents. `niches.ts` holds the three offers; change them there.
- `app/`: the dashboard.

## Safety rails

- Only emails listed in the `app_owner` table can sign in and see data, and only after the second sign-in step (authenticator app). The login page never creates new accounts.
- Every agent has a daily AI budget (USD) checked before and during each run.
- The kill switch pauses every agent and stops all sending.
- Agents can only draft, always to the lead's saved email. The worker sends an email only after the owner approves it, at most `daily_send_cap` a day (40 to start), with a signature and an opt-out line added.
- Leads marked `opted_out` are never emailed.
- The forex brief forbids personal trading advice, signals or return promises.

## Security and SOC 2 groundwork

SOC 2 is a report from an independent CPA firm; code cannot grant it. This repo builds the controls and the evidence so an audit is quick when a buyer asks. Scope: Security and Confidentiality. Policies are in [`policies/`](policies/README.md).

- **Two-step sign-in.** Email link, then an authenticator app code. The database serves data only to MFA sessions (`aal2`).
- **Outbound guard.** Every draft is checked in code (recipient must be the lead's saved email, no outside links, no requests for money or credentials, no trading claims) and by Haiku. Blocked drafts never reach the queue; flagged ones need "Approve anyway". There is no bulk approve.
- **Audit log.** Database triggers record every change to approvals, settings, agents, revenue, owners, keys and controls, with the signed-in actor. It is append-only and hash-chained.
- **Security agent** (daily): access rules on every table, extra accounts, owner MFA, sign-ups off, browser key safety, key rotation, `npm audit`, audit chain, spend and sending spikes, dashboard headers, and CI and Dependabot status if `GITHUB_TOKEN` is set. A new critical finding turns on the kill switch.
- **Compliance agent** (weekly, code only): hashed evidence snapshots per control, data retention, and reminders for recurring controls (access review, key rotation, restore test, policy and vendor review).
- **Security page** on the dashboard: findings, recurring controls, key register, audit log and evidence.
- **CI** (`.github/workflows/security.yml`, free): type check, build, `npm audit`, gitleaks secret scan, and a check that no server secret appears in dashboard code. Dependabot is on.

Run them by hand with `npm run security` or `npm run compliance`.

## Setup

1. **Supabase**: create a free project. In the SQL editor, run `supabase/migrations/0001_init.sql`, then add yourself as owner:
   ```sql
   insert into app_owner (email) values ('you@example.com');
   ```
   Then run `supabase/migrations/0002_security.sql`.
   Under Authentication, create a user with the same email, **turn off public sign-ups**, and make sure TOTP MFA is enabled (Authentication > Multi-Factor). The first time you sign in, the dashboard asks you to set up an authenticator app; without it the dashboard shows no data.
2. **Environment**: copy `.env.example` to `.env.local` and fill it in. The Supabase service role key and the Anthropic API key go to the worker only.
3. **Dashboard**: `npm install`, then `npm run dev` locally, or deploy to Vercel with the two `NEXT_PUBLIC_` variables.
4. **Worker**: on a small server (Railway, Render or a Hetzner box), set the worker variables and run `npm run worker`. To run one agent once: `npm run agent -- ceo` (or `research`, `sales`, `send`).
5. **Email** (optional at first): use a separate outreach domain with SPF, DKIM and DMARC set up, and warm it for 2 to 3 weeks before real volume. Without SMTP settings, approved emails wait in the queue.

## Costs

Every agent uses Claude Opus 5.5 with adaptive thinking. Effort is set per agent: low for Research, medium for Sales and high for the CEO. The default cap is $5 a day per agent, about £12 a day across the three, and you can change it on the Agents page.

## Not built yet (next phases)

- Reading replies from the inbox and drafting answers (Phase 1b)
- Free-proof builders per niche, Proposal, Delivery and QA agents (Phase 2)
- Stripe Checkout for paid pilots and a revenue webhook (Phase 2)
- Marketing and Finance agents (Phase 3)
