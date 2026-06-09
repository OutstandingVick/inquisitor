# Inquisitor

**Interrogate every release before it ships.**

Inquisitor is a Gemini-powered release risk agent for GitLab. It helps engineering teams decide whether a release is safe by investigating merge requests, issues, pipeline status, and release blockers through the GitLab MCP server.

Instead of only answering questions, Inquisitor plans an investigation, gathers evidence, scores release readiness, asks for human approval, and creates follow-up work for unresolved blockers.

## Hackathon Track

| Item | Detail |
| --- | --- |
| Challenge | Building Agents for Real-World Challenges |
| Partner track | GitLab |
| Agent platform | Google Cloud Agent Builder |
| Reasoning model | Gemini 3 |
| Partner integration | GitLab MCP server |

## Problem

Release readiness is often checked manually across GitLab issues, merge requests, CI pipelines, review comments, and release notes. That manual process is slow, inconsistent, and easy to miss under pressure.

Inquisitor turns release checks into an agentic workflow: it investigates the current project state, identifies risks, explains the evidence, and prepares approved follow-up actions.

## Demo Prompt

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

## Core Workflow

1. User asks Inquisitor to investigate a release.
2. Inquisitor creates an investigation plan.
3. Inquisitor uses the GitLab MCP server to inspect issues, merge requests, pipelines, and release labels.
4. Gemini analyzes the evidence and assigns a readiness score.
5. Inquisitor recommends actions and asks for human approval.
6. After approval, Inquisitor creates GitLab follow-up issues for blockers.
7. The user receives a final release decision report.

## MVP Scope

- Release readiness score
- Risk summary grouped by severity
- Evidence list from GitLab data
- Human approval checkpoint
- Follow-up issue creation plan
- Hosted demo UI for judges

## Demo Scenario

The demo GitLab project is modeled in `demo-data/gitlab-demo-project.json` and documented in `docs/gitlab-demo-project.md`.

The scenario centers on `acme/checkout-platform`, where the `release/friday` branch has:

- A failing `checkout-e2e` pipeline job
- An open `release-blocker` issue for payment confirmation failures
- Approved but unmerged release merge requests
- A recent auth-service change without regression test evidence

Create the demo labels and starter issues in a real GitLab project:

```bash
npm run seed:gitlab -- --dry-run
GITLAB_TOKEN=your_token GITLAB_PROJECT_ID=your_project_id npm run seed:gitlab
```

This gives Inquisitor a realistic investigation target before the live GitLab MCP integration is connected.

## Repository Structure

```text
README.md
LICENSE
index.html
styles.css
scripts/
  seed-gitlab-demo.js
src/
  frontend/
    app.js
  server/
    index.js
  agent/
    workflow.md
    release-investigator.js
  mcp/
    gitlab-mcp-contract.md
    mock-gitlab-adapter.js
    gitlab-mcp-adapter.js
demo-data/
  gitlab-demo-project.json
  release-snapshot.json
docs/
  architecture.md
  agent-builder-integration.md
  agent-builder-openapi.yaml
  demo-script.md
  render-live-mode.md
  gitlab-demo-project.md
  judging-guide.md
  partner-integration.md
  safety.md
```

## Running Locally

Install is not required for the current prototype because it uses only built-in Node.js modules.

Start the local app:

```bash
npm run dev
```

Then visit:

```text
http://localhost:8787
```

Run syntax checks:

```bash
npm run check
```

The current server uses `demo-data/release-snapshot.json` as a mock GitLab MCP response. The broader demo GitLab project shape is available at:

```text
http://localhost:8787/api/demo-project
```

This keeps the app runnable while the real Google Cloud Agent Builder and GitLab MCP integration is wired in.

Run against the seeded GitLab demo project:

```bash
INQUISITOR_ADAPTER=gitlab \
GITLAB_PROJECT_ID=82910266 \
GITLAB_TOKEN=your_token \
GITLAB_RELEASE_BRANCH=release/friday \
npm start
```

See `docs/agent-builder-integration.md` for the Agent Builder handoff plan.

See `docs/render-live-mode.md` for enabling the hosted Render app against the seeded live GitLab project.

## Submission Assets

- Hosted project URL: https://inquisitor-42jb.onrender.com
- Public repository URL: https://github.com/OutstandingVick/inquisitor
- Demo video URL: TBD
- Devpost URL: TBD

## License

MIT
