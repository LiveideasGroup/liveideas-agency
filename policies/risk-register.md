# Risk register

Scores: likelihood and impact from 1 (low) to 3 (high). Reviewed yearly ("risk_review").

| Risk | L | I | Controls | Owner |
| --- | --- | --- | --- | --- |
| Owner's email account taken over, giving dashboard access | 2 | 3 | TOTP MFA enforced in the database; MFA on the email account | Francis |
| Service role key or Anthropic key leaks | 2 | 3 | Host secret store; CI secret scan; browser-key check; 90-day rotation | Francis |
| A web page steers an agent (prompt injection) into a harmful email | 3 | 2 | Outbound guard; recipient locked to the lead's email; no bulk approve; owner approval | Francis |
| Agents overspend on the API | 2 | 2 | Per-agent daily budgets; spend spike check; kill switch | Francis |
| Emails breach UK PECR/GDPR or FCA rules | 2 | 3 | Business emails only; opt-out line; retention; forex guardrails; guard blocks trading claims | Francis |
| Vulnerable dependency | 2 | 2 | Dependabot; npm audit in CI and daily | Francis |
| Data loss | 1 | 3 | Backups and quarterly restore test | Francis |
| History altered to hide a mistake | 1 | 2 | Append-only, hash-chained audit log, checked daily | Francis |
| Single person, so no second reviewer | 3 | 2 | Automated review plus CI on every change; tamper-evident logs | Francis |
