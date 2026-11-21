# Security policies

Short policies for a one-person company run by AI agents. They describe what we actually do, so an auditor can test them.
Each maps to the SOC 2 Trust Services Criteria (2017, revised 2022). Scope: Security and Confidentiality.

| Policy | Criteria | Owner | Review |
| --- | --- | --- | --- |
| [Information security](information-security.md) | CC1, CC2, CC5 | Francis | Yearly |
| [Access control](access-control.md) | CC6.1 to CC6.3 | Francis | Yearly; access review every 90 days |
| [Change management](change-management.md) | CC8.1 | Francis | Yearly |
| [Incident response](incident-response.md) | CC7.3 to CC7.5 | Francis | Yearly; drill yearly |
| [Vendor management](vendor-management.md) | CC9.2 | Francis | Yearly |
| [Data handling and retention](data-retention.md) | C1.1, C1.2, CC6.7 | Francis | Yearly |
| [Backup and recovery](backup-recovery.md) | A1.2, A1.3 | Francis | Yearly; restore test every 90 days |
| [Risk register](risk-register.md) | CC3.1 to CC3.4 | Francis | Yearly |

Approval: the owner approves these by merging the pull request that changes them, and marks "policy_review" done on the
Security page each year. Git history is the record of every version.
