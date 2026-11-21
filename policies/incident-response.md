# Incident response runbook

**An incident** is any suspected leak of a key or data, unknown sign-in, unexpected outbound email, broken audit chain, or a critical finding.

1. **Contain (minutes).** Press "Pause everything" on the Agents page (the Security agent does this itself for critical findings).
   If a key may have leaked, rotate it at the provider straight away.
2. **Assess (same day).** Check the Security page, the audit log, Supabase auth logs, and the email provider's sent log. Write down what happened, when, and what data was involved.
3. **Notify.** If personal data of others may be affected, decide within 72 hours whether to report to the ICO (UK GDPR Article 33) and tell the people affected. Tell any affected client as their contract requires.
4. **Recover.** Fix the cause in a pull request, restore from backup if data was changed, then resume agents.
5. **Learn.** Add a short note to `policies/incidents/YYYY-MM-DD-title.md`: timeline, cause, fix, and what changes to stop it happening again.

Drill once a year with a made-up scenario and mark "incident_drill" done on the Security page.
