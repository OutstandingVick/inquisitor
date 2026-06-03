# Judging Guide

## Track

Inquisitor is submitted to the GitLab partner track.

## What To Test

Use this prompt:

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

## Expected Agent Behavior

1. Create an investigation plan.
2. Use GitLab MCP tools to inspect project state.
3. Analyze release risk with Gemini.
4. Produce a release readiness score.
5. Ask for approval before writing to GitLab.
6. Prepare or create follow-up issues after approval.

## What Makes This An Agent

- It plans a multi-step task.
- It uses tools to gather operational evidence.
- It reasons over real project state.
- It takes approved action.
- It returns a concrete release decision.

## Success Criteria

- The agent identifies at least one release blocker.
- The GitLab MCP integration is visible and meaningful.
- The agent does not write to GitLab before approval.
- The final report is useful to an engineering lead.
