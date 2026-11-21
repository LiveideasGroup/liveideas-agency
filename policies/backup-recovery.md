# Backup and recovery

- **Now (free plan):** export the database weekly with `supabase db dump` to encrypted storage only the owner can reach.
- **Before storing a paying client's data:** move to Supabase Pro for daily automatic backups (about $25 a month).
- **Restore test, every 90 days:** restore the latest backup into a scratch Supabase project, check row counts on `leads`, `approvals` and `revenue`, then delete the scratch project. Mark "restore_test" done on the Security page.
- **Code** is in GitHub; the worker can be redeployed from `main` on any host in under an hour.
- **Targets:** lose at most 24 hours of data (RPO), back up within 1 working day (RTO).
