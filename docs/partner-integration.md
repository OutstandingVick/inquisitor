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

## Centrality

The GitLab MCP integration is not decorative. Without it, Inquisitor could only describe a release checklist. With it, the agent can perform the checklist against real project evidence and prepare the next actions.
