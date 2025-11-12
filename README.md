# AI Productivity OS (Mobile-Optimized)
Modular, mobile-first system: three agents, workflows, a dashboard, and CI/CD.
## Agents
- Slack Monitor • Prompt Enhancer • Orchestrator
## Workflows
- Defined in `workflows/` JSON + schema
## Dashboard
- `dashboard-mobile/` (index.html, style.css, dashboard.js)
## CI/CD
- `.github/workflows/deploy.yml` (manual deploy)
- `ci-cd/railway-config.yaml`
- `ci-cd/vercel-config.json`
## Ops
- `ops/daily_operations_checklist_mobile.pdf`
## Meta-Enhancement Log
- `meta-enhancement-log/meta_enhancement_log_index.pdf`
## Android quickstart
1. Create repo (GitHub app) → Upload files (use full paths).
2. Deploy agents on Deta Space → Save URLs.
3. Deploy dashboard to Vercel.
4. Test `/status`, `/pause`, `/resume` per agent.
