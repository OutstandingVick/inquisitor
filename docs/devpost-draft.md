# Devpost Submission Draft

## Project Name

Inquisitor

## Links

- Hosted demo: https://inquisitor-42jb.onrender.com
- Source code: https://github.com/OutstandingVick/inquisitor
- Demo video: TBD

## Tagline

Interrogate every release before it ships.

## Track

GitLab

## Elevator Pitch

Inquisitor is a release-readiness investigator for GitLab projects. It checks the evidence engineering teams normally inspect by hand, turns that evidence into a release risk report, and prepares follow-up actions that stay behind a human approval step.

## What It Does

Inquisitor helps engineering teams determine whether a release is safe by investigating issues, merge requests, CI pipelines, release blockers, and risky recent changes.

The agent workflow plans a release investigation, gathers GitLab-shaped project evidence, generates a readiness score, highlights blockers, asks for approval, and prepares follow-up issue actions for unresolved risks.

The hosted demo shows a Friday release review for `acme/checkout-platform`, including:

- A failing `checkout-e2e` pipeline signal
- An open `release-blocker` payment issue
- Pending release merge requests
- A risky auth-service change without regression test evidence
- Approval-gated follow-up issue drafts

## Inspiration

Release decisions are often made under time pressure, and the required evidence is scattered across GitLab issues, merge requests, pipelines, review comments, and commits. Teams need more than a chatbot that explains a checklist. They need an agent that can perform the investigation and prepare the next actions.

## How We Built It

Inquisitor is built as a small Node.js application with a deliberately agent-shaped architecture:

```text
Frontend
→ Server API
→ Release Investigator
→ GitLab Adapter
→ Mock data now / GitLab MCP later
```

The current prototype uses a mock GitLab adapter backed by `demo-data/gitlab-demo-project.json`, plus a GitLab seed script that creates the demo labels, issues, branches, merge requests, and failing release CI in a real GitLab project. The app also includes a live GitLab adapter mode that can read the seeded GitLab project using `INQUISITOR_ADAPTER=gitlab`.

The intended challenge architecture is Google Cloud Agent Builder for orchestration, Gemini 3 for planning and reasoning, and GitLab MCP as the operational tool layer. The Agent Builder handoff is documented in `docs/agent-builder-integration.md`.

For deployment, the public Render service defaults to safe mock mode. `docs/render-live-mode.md` explains how to switch the hosted service to `INQUISITOR_ADAPTER=gitlab` using Render environment variables.

## Partner Integration

GitLab is the natural partner for this workflow because release readiness lives inside GitLab: issues, merge requests, pipelines, commits, labels, and comments.

The project includes:

- A GitLab demo-project seed script
- A GitLab adapter contract
- A mock GitLab adapter with the same shape as the future MCP adapter
- A live `gitlab-mcp-adapter.js` that reads GitLab project evidence and can prepare/create approved follow-up issues
- A Streamable HTTP MCP endpoint at `/mcp` for Agent Studio tool setup
- Documentation mapping Inquisitor’s investigation steps to GitLab MCP capabilities

The GitLab MCP integration is the planned execution layer. Without GitLab/MCP, Inquisitor can only model release evidence; with GitLab/MCP, it can inspect live project state and prepare approved follow-up actions.

## What Makes It An Agent

Inquisitor does not just answer release questions. It:

- Plans a multi-step investigation
- Uses a tool/adapter boundary to gather project evidence
- Reasons over release risk signals
- Requests approval before writes
- Prepares concrete follow-up issue actions
- Produces a release decision report

## How To Test

Hosted demo:

```text
https://inquisitor-42jb.onrender.com
```

Use the default prompt:

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

Expected result:

1. The UI runs an investigation.
2. Inquisitor returns a `72%` readiness score.
3. It identifies the failing checkout pipeline and open release blocker.
4. It asks for approval before preparing write actions.
5. After approval, it prepares follow-up GitLab issue drafts.

API endpoint for the demo scenario:

```text
https://inquisitor-42jb.onrender.com/api/demo-project
```

## Challenges

The hardest part is making the agent decisive without making it reckless. Release decisions affect real teams, so Inquisitor is designed to investigate automatically but require approval before any GitLab write action.

Another challenge was making the prototype judgeable before the final live Agent Builder/MCP wiring. To solve that, the app uses a GitLab adapter boundary and a real GitLab demo seeding workflow so the mock and live implementations share the same shape.

## Accomplishments

- Built a hosted release-risk investigation UI
- Added a reusable release investigator module
- Added a GitLab adapter boundary
- Created a realistic GitLab demo project dataset
- Added a seed script for GitLab labels, issues, branches, merge requests, and failing CI
- Added approval-gated follow-up action preparation
- Documented architecture, safety, judging flow, and partner integration

## What's Next

- Connect the UI to the live Google Cloud Agent Builder endpoint
- Replace the mock adapter with live GitLab MCP calls
- Add CI log summarization
- Add unresolved review thread analysis
- Add release note generation
- Add owner assignment based on GitLab project history
