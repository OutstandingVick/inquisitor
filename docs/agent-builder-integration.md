# Agent Builder Integration

This document explains how Inquisitor is prepared for the challenge-required Google Cloud Agent Builder + Gemini + GitLab MCP workflow.

## Current Integration Shape

Inquisitor now has three separable layers:

```text
Hosted UI / API
  -> Release Investigator
  -> GitLab Adapter
  -> GitLab project evidence
```

The local and hosted demo default to:

```text
INQUISITOR_ADAPTER=mock
```

For live GitLab project evidence, run with:

```bash
INQUISITOR_ADAPTER=gitlab
GITLAB_PROJECT_ID=82910266
GITLAB_TOKEN=...
GITLAB_RELEASE_BRANCH=release/friday
npm start
```

By default, write actions are prepared but not created:

```text
INQUISITOR_WRITE_MODE=prepare
```

To create approved follow-up issues in GitLab:

```text
INQUISITOR_WRITE_MODE=live
```

## Agent Builder Handoff

Use `src/agent/instructions.md` as the Agent Builder system instruction.

Expose these API operations to Agent Builder as tools:

| Operation | Method | Path | Purpose |
| --- | --- | --- | --- |
| Investigate release | `POST` | `/api/investigate` | Plans the release investigation and returns readiness evidence |
| Approve actions | `POST` | `/api/approve-actions` | Creates or prepares approved follow-up issue actions |
| Demo project summary | `GET` | `/api/demo-project` | Shows the GitLab project evidence shape |
| Health check | `GET` | `/api/health` | Confirms whether the app is using mock or live GitLab mode |

An OpenAPI tool specification is provided at:

```text
docs/agent-builder-openapi.yaml
```

If Agent Studio asks for an MCP server instead of an OpenAPI tool, use:

```text
MCP display name: Inquisitor
Endpoint URL: https://inquisitor-42jb.onrender.com/mcp
Authentication: None
```

The `/mcp` endpoint exposes:

- `investigate_release`
- `approve_release_actions`
- `get_demo_project_summary`

## Gemini Role

Gemini should handle:

- Interpreting the user release goal
- Deciding when to call `/api/investigate`
- Explaining the release readiness result
- Asking for approval before `/api/approve-actions`
- Summarizing the final release decision

The Inquisitor API handles deterministic GitLab evidence collection, readiness scoring, and approval-gated action preparation.

## GitLab MCP Role

`src/mcp/gitlab-mcp-adapter.js` currently implements the adapter contract against GitLab project APIs. It is the live integration proof and maps directly to the GitLab MCP capabilities the challenge expects:

| Inquisitor adapter method | GitLab/MCP capability |
| --- | --- |
| `getProject()` | Read project metadata |
| `listLabels()` | Read labels |
| `listIssues()` | Read release blockers and high-priority issues |
| `listMergeRequests()` | Read release-targeted merge requests and approvals |
| `listPipelines()` | Read release branch pipelines and jobs |
| `listRecentCommits()` | Read recent commits and changed files |
| `createIssueDrafts()` | Prepare or create approved follow-up issues |

When the GitLab MCP server is available inside Agent Builder, this adapter can be replaced with direct MCP tool calls while preserving the same release investigator contract.

## Verification

Mock mode:

```bash
npm run check
npm run dev
curl http://localhost:8787/api/health
curl http://localhost:8787/api/demo-project
```

Live GitLab mode:

```bash
INQUISITOR_ADAPTER=gitlab \
GITLAB_PROJECT_ID=82910266 \
GITLAB_TOKEN=... \
GITLAB_RELEASE_BRANCH=release/friday \
npm start
```

Then test:

```bash
curl http://localhost:8787/api/health
curl -X POST http://localhost:8787/api/investigate \
  -H 'content-type: application/json' \
  -d '{"prompt":"Check if our Friday release is safe to ship."}'
```
