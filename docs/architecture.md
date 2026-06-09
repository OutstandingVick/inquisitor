# Architecture

```text
User
  |
  v
Hosted Inquisitor UI
  |
  v
Server API
  |
  v
Release Investigator
  |
  v
GitLab Adapter
  |
  +--> Mock GitLab data for local demo
  |
  +--> GitLab MCP server for live integration
  |
  v
GitLab project data
  |
  v
Release risk report and approved follow-up actions
```

## Layers

| Layer | Technology |
| --- | --- |
| Demo UI | Static web app served by the local Node server |
| Server API | Built-in Node.js HTTP server |
| Agent logic | `src/agent/release-investigator.js` |
| Adapter boundary | `src/mcp/mock-gitlab-adapter.js` and `src/mcp/gitlab-mcp-adapter.js` |
| Agent orchestration | Google Cloud Agent Builder |
| Reasoning | Gemini 3 |
| Tool layer | GitLab MCP server |
| Source system | GitLab issues, merge requests, pipelines, commits |
| Oversight | Approval checkpoint before writes |

## Current Prototype

The current app uses a mock GitLab adapter that reads `demo-data/gitlab-demo-project.json`. This gives the demo a stable release scenario while preserving the same interface that the live GitLab MCP adapter will implement.

```text
Server route
  -> Release Investigator
  -> Mock GitLab Adapter
  -> Demo GitLab JSON
```

## Live Integration Target

The live version swaps the mock adapter for the GitLab adapter:

```text
Server route / Agent Builder tool
  -> Release Investigator
  -> GitLab Adapter
  -> GitLab project APIs / GitLab MCP Server
  -> GitLab project
```

This keeps the release investigation logic independent from the data source. The agent can score risk, build evidence, and prepare approval-gated actions whether the data comes from the local demo dataset or GitLab MCP.

Set `INQUISITOR_ADAPTER=gitlab` to run the same API against the seeded GitLab demo project.

## Why This Is Agentic

Inquisitor does not only answer a release question. It breaks the request into a plan, gathers evidence from GitLab, reasons over the release state, asks for approval, and prepares real follow-up work.
