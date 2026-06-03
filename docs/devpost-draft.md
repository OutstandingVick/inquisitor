# Devpost Draft

## Project Name

Inquisitor

## Tagline

Interrogate every release before it ships.

## What It Does

Inquisitor is a Gemini-powered release risk agent for GitLab. It helps engineering teams determine whether a release is safe by investigating issues, merge requests, CI pipelines, and release blockers through the GitLab MCP server.

The agent plans a release investigation, gathers evidence from GitLab, generates a readiness score, highlights blockers, asks for approval, and prepares follow-up GitLab issues for unresolved risks.

## Inspiration

Release decisions are often made under time pressure, and the required evidence is scattered across GitLab issues, merge requests, pipelines, review comments, and commits. Teams need more than a chatbot that explains a checklist. They need an agent that can perform the investigation and prepare the next actions.

## How We Built It

Inquisitor is designed around Google Cloud Agent Builder for orchestration, Gemini 3 for planning and reasoning, and GitLab MCP as the operational tool layer. The hosted demo shows the release investigation workflow, approval checkpoint, and final readiness report.

## Partner Integration

The GitLab MCP server is central to Inquisitor. It gives the agent access to the project evidence needed to make a release decision:

- Open release blockers
- Merge request state
- CI pipeline health
- Failed jobs
- Recent commits
- Follow-up issue creation

Without the GitLab MCP integration, Inquisitor could only describe release best practices. With it, the agent can inspect a real project and prepare approved follow-up actions.

## What Makes It An Agent

Inquisitor does not just answer release questions. It:

- Plans a multi-step investigation
- Uses GitLab MCP tools
- Reasons over project evidence
- Requests approval before writes
- Prepares concrete follow-up issues
- Produces a release decision report

## Challenges

The hardest part is making the agent decisive without making it reckless. Release decisions affect real teams, so Inquisitor is designed to investigate automatically but require approval before any GitLab write action.

## What's Next

- Connect the UI to the live Agent Builder endpoint
- Test against a real GitLab demo project
- Add CI log summarization
- Add unresolved review thread analysis
- Add release note generation
- Add owner assignment based on GitLab project history
