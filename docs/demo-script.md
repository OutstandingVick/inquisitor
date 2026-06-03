# Three-Minute Demo Script

## 0:00-0:20 Problem

Engineering teams often decide release readiness by manually checking GitLab issues, merge requests, and pipelines. That creates missed blockers and slow release calls.

## 0:20-0:40 Agent Command

Prompt:

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

## 0:40-1:30 Investigation

Show Inquisitor planning the investigation and using GitLab MCP to inspect:

- Release branch pipelines
- Open release blockers
- Approved but unmerged merge requests
- Recent risky changes

## 1:30-2:10 Decision

Show the readiness score, key evidence, and verdict:

```text
Release readiness: 72%
Verdict: Ship with caution. Resolve critical CI and checkout blockers first.
```

## 2:10-2:40 Approval

Show the agent asking before writing to GitLab.

## 2:40-3:00 Result

Approve the action and show prepared follow-up issues for the blockers.
