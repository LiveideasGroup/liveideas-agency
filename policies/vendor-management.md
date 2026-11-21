# Vendor management

We keep each vendor's security report on file and review the list yearly ("vendor_review" on the Security page).

| Vendor | Used for | Data it holds | Assurance to collect |
| --- | --- | --- | --- |
| Supabase | Database, sign-in | All app data, lead contact details | SOC 2 Type II report (dashboard, Organization settings) |
| Vercel | Dashboard hosting | Session cookies in transit | SOC 2 Type II report (trust center) |
| Anthropic | Claude API for agents | Prompts with lead and business data | SOC 2 Type II report (trust center); API data not used for training by default under commercial terms |
| Worker host (Railway, Render or Hetzner) | Runs the agents | Secrets, data in memory | Their SOC 2 or ISO 27001 certificate |
| Email provider (e.g. Google Workspace) | Sending approved emails | Outbound emails | SOC 2 / ISO 27001 report |
| GitHub | Code, CI | Source code | SOC 2 Type II report |

New vendors that will hold company or client data are added here before use.
