# Change management policy

1. `main` is protected: no direct pushes, a pull request is required, and the `security` workflow must pass.
2. The `security` workflow runs a type check, a production build, `npm audit` for high and critical advisories, a gitleaks secret scan over full history, and a check that no server secret is referenced in dashboard code.
3. Each pull request is reviewed by an automated reviewer and approved by the owner before merge.
4. Database changes are new numbered files in `supabase/migrations/`; existing migrations are never edited after they run.
5. Dependabot opens weekly update pull requests; they follow the same rules.
6. Emergency fix: may be merged by the owner with the checks passing, and the reason is written in the pull request.
