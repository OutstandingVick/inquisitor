# Inquisitor Agent Workflow

## Primary User Goal

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

## Agent Responsibilities

1. Convert the release request into an investigation plan.
2. Gather evidence from GitLab through the GitLab MCP server.
3. Score release readiness with Gemini reasoning.
4. Explain risks in clear engineering language.
5. Ask for approval before creating or updating GitLab records.
6. Create approved follow-up issues for blockers.
7. Return a final release decision report.

## Investigation Plan

| Step | Evidence | GitLab MCP Role |
| --- | --- | --- |
| Inspect release branch | Branch name, latest commit, diff summary | Read project refs and commits |
| Inspect pipelines | Failed jobs, status, logs | Read pipeline and job data |
| Inspect issues | Open blockers, bugs, priorities | Search/read issues |
| Inspect merge requests | Approval, mergeability, review state | Search/read MRs |
| Prepare actions | Follow-up issue payloads | Create issues after approval |

## Readiness Scoring

| Signal | Weight |
| --- | --- |
| Failed release pipeline | Critical |
| Open release-blocker issue | Critical |
| Unmerged approved MR | Medium |
| High-risk file changes | Medium |
| Missing test changes | Medium |
| Unresolved review discussion | High |

## Human Approval Rule

Inquisitor may read GitLab data automatically. It must ask for explicit approval before creating issues, changing labels, assigning owners, posting comments, or triggering release actions.
