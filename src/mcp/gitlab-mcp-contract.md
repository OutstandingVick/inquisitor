# GitLab MCP Contract

This document defines how Inquisitor expects to use the GitLab MCP server.

## Required Read Tools

| Capability | Purpose |
| --- | --- |
| List project issues | Find open bugs and release blockers |
| Get issue details | Read labels, assignees, state, and discussion |
| List merge requests | Find pending release work |
| Get merge request details | Check approval, mergeability, review state |
| List pipelines | Identify failed or pending CI |
| Get pipeline jobs/logs | Explain root cause of CI failure |
| Read commits/diffs | Detect risky recent changes |

## Required Write Tools

| Capability | Purpose |
| --- | --- |
| Create issue | Create approved release blocker follow-ups |
| Add issue label | Mark generated tasks as release-risk |
| Assign issue | Route approved work to owners when available |
| Add comment | Post release report or investigation summary |

## Human Oversight

All write tools must be approval-gated in the Agent Builder workflow.
