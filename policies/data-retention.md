# Data handling and retention

**Classes.**
- *Secret*: API keys, service role key, SMTP password. Host secret stores only.
- *Confidential*: client data (future builds), revenue, lead contact details. Database only, owner-only access.
- *Internal*: agent tasks, events, metrics.

**Leads (personal data under UK GDPR, legitimate interest for B2B outreach).**
- Only business emails the company publishes itself; never guessed.
- Every email carries an opt-out line. Opted-out leads are never contacted again.
- The Compliance agent runs `apply_retention()` weekly: leads marked lost with no activity for 12 months are deleted; opted-out leads are reduced to company and email after 30 days so we can keep honouring the opt-out.

**Client data (before the first build contract).** Kept in a separate project per client, deleted within 30 days of contract end unless the contract says otherwise, never used to train or prompt work for another client.

**Encryption.** Supabase and Vercel encrypt data at rest and use TLS in transit. The dashboard sends HSTS.
