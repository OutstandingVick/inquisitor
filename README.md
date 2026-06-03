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

## Repository Structure

```text
README.md
LICENSE
index.html
styles.css
src/
  frontend/
    app.js
  agent/
    workflow.md
  mcp/
    gitlab-mcp-contract.md
demo-data/
  release-snapshot.json
docs/
  architecture.md
  demo-script.md
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

The current server uses `demo-data/release-snapshot.json` as a mock GitLab MCP response. This keeps the app runnable while the real Google Cloud Agent Builder and GitLab MCP integration is wired in.

## Submission Assets

- Hosted project URL: TBD
- Public repository URL: TBD
- Demo video URL: TBD
- Devpost URL: TBD

## License

MIT
