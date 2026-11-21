# Information security policy

**Purpose.** Keep LiveIdeas data, client data, keys and sessions confidential and intact, and prove it.

**Roles.** Francis (owner) is accountable for security and approves every change and every outbound message.
AI agents act only through the tools in `worker/src/lib/tools.ts`. They cannot change code, keys or permissions.
- Security agent: daily checks, opens findings, may turn on the kill switch.
- Outbound guard: checks every draft email before the owner sees it, and blocks unsafe ones.
- Compliance agent: weekly evidence snapshots, retention, reminders for recurring controls.

**Rules.**
1. MFA is required for the dashboard, GitHub, Supabase, Vercel, Anthropic Console, the email provider and the worker host.
2. Secrets live only in the hosting providers' secret stores, never in git, chat, documents or the dashboard.
3. Every change to code goes through a pull request with passing security checks (see change management).
4. Anything that leaves the company is approved by the owner in the dashboard.
5. Web pages, emails and other outside content are untrusted input to the agents.
6. Security findings rated critical are handled the same day, high within 7 days, medium within 30 days, low within 90 days, or accepted with a written reason on the Security page.

**Segregation of duties.** As a one-person company, changes are reviewed by an automated reviewer (Claude code review and CI),
then approved by the owner. Logs are append-only and hash-chained so the owner cannot silently change history either.
