# Access control policy

1. **Dashboard.** Only emails in the `app_owner` table can read or change data, and only with a second factor (TOTP).
   The database enforces both (`is_owner()` requires `aal2`). Public sign-ups are disabled in Supabase.
2. **Agents.** The worker uses the Supabase service role key. It runs on one host whose secrets only the owner can read.
3. **Browser key.** Only the Supabase anon (publishable) key may be shipped to the browser. CI fails if dashboard code references a server secret, and the Security agent checks the browser key is not the service key.
4. **Least privilege.** Optional `GITHUB_TOKEN` for the Security agent is a fine-grained, read-only token for this one repository.
5. **Access review, every 90 days.** List who can sign in to: Supabase (users and `app_owner`), GitHub repo collaborators, Vercel team, worker host, Anthropic Console, email provider. Remove anyone not needed, then mark "access_review" done on the Security page.
6. **Key rotation, every 90 days** or straight away after any suspected leak: rotate at the provider, update the worker host, mark it on the Security page.
7. **Leavers.** If a contractor is ever added, their access is removed on their last day and the review is recorded.
