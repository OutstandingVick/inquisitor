# Architecture

```text
User
  |
  v
Hosted Inquisitor UI
  |
  v
Google Cloud Agent Builder
  |
  v
Gemini 3 planning and reasoning
  |
  v
GitLab MCP server
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
| Demo UI | Static web app initially, deployable to any static host |
| Agent orchestration | Google Cloud Agent Builder |
| Reasoning | Gemini 3 |
| Tool layer | GitLab MCP server |
| Source system | GitLab issues, merge requests, pipelines, commits |
| Oversight | Approval checkpoint before writes |

## Why This Is Agentic

Inquisitor does not only answer a release question. It breaks the request into a plan, gathers evidence from GitLab, reasons over the release state, asks for approval, and prepares real follow-up work.
