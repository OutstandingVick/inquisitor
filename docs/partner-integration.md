# Partner Integration

## Why GitLab

Release readiness lives inside GitLab: issues, merge requests, CI pipelines, reviews, commits, labels, assignees, and comments. Inquisitor needs GitLab as its source of truth and action surface.

## MCP Role

The GitLab MCP server gives Inquisitor the ability to inspect and act inside a project.

| Use | Example |
| --- | --- |
| Read issues | Find open items labeled `release-blocker` |
| Read merge requests | Check approval and merge state |
| Read pipelines | Detect failing CI before release |
| Read commits | Identify risky recent code changes |
| Create issues | Generate approved follow-up blockers |
| Add comments | Post release investigation summaries |

## Adapter Boundary

Inquisitor now has a GitLab adapter boundary under `src/mcp`.

| File | Purpose |
| --- | --- |
| `src/mcp/mock-gitlab-adapter.js` | Reads the local demo GitLab project dataset |
| `src/mcp/gitlab-mcp-adapter.js` | Live GitLab-backed adapter that maps to MCP capabilities |
| `src/agent/release-investigator.js` | Consumes the adapter and performs the release investigation |

This structure makes the mock demo honest: it is not a separate fake path. It uses the same agent interface the real GitLab MCP integration will use.

The app can run in live GitLab mode with:

```bash
INQUISITOR_ADAPTER=gitlab
GITLAB_PROJECT_ID=82910266
GITLAB_TOKEN=...
GITLAB_RELEASE_BRANCH=release/friday
```

In live mode, Inquisitor reads project metadata, labels, issues, merge requests, pipeline jobs, and recent commits from the seeded GitLab project.

## Centrality

The GitLab MCP integration is not decorative. Without it, Inquisitor could only describe a release checklist. With it, the agent can perform the checklist against real project evidence and prepare the next actions.
