# AI Productivity OS (Mobile-Optimized)
Modular, mobile-first system with advanced multi-agent AI workflows, specialized agents, dashboard, and CI/CD.

## Multi-Agent System (NEW)
Advanced AI workflow system with 7 specialized agents:
- **ResearchAgent** - Planning & Information Gathering
- **ImplementationAgent** - Solution Development & Documentation
- **VerificationAgent** - Quality Assurance & Improvement
- **MetaPromptOptimizer** - Prompt Optimization & Learning
- **PerformanceAuditor** - Performance & Ethical Review
- **AnomalyDetectionAgent** - Anomaly Detection & Self-Correction
- **UserInteractionAgent** - User Engagement & Feedback

See `multi-agent-system/README.md` for detailed documentation.

## Basic Agents
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
