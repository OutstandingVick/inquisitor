# Safety And Oversight

Inquisitor is designed for human-controlled engineering workflows.

## Read Actions

The agent may read GitLab project state without approval:

- Issues
- Merge requests
- Pipelines
- Jobs
- Commits
- Labels

## Write Actions

The agent must request approval before:

- Creating issues
- Updating labels
- Assigning owners
- Posting comments
- Triggering release or remediation actions

## Approval Principle

Inquisitor can investigate autonomously, but release-impacting changes remain under user control.
