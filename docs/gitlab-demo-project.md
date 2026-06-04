# GitLab Demo Project

This is the demo project state Inquisitor should investigate during the hackathon video.

## Demo Repository

| Field | Value |
| --- | --- |
| Project name | `acme/checkout-platform` |
| Release branch | `release/friday` |
| Default branch | `main` |
| Release owner | `Maya Chen` |
| Primary service | Checkout and payment confirmation |

## Demo Prompt

```text
Check if our Friday release is safe to ship, identify blockers, and prepare follow-up actions.
```

## Seed Script

Use the seed script to create the demo labels and starter issues in a real GitLab project.

Preview what it will do:

```bash
npm run seed:gitlab -- --dry-run
```

Run against GitLab:

```bash
GITLAB_TOKEN=your_token GITLAB_PROJECT_ID=your_project_id npm run seed:gitlab
```

Optional:

```bash
GITLAB_BASE_URL=https://gitlab.com
```

The token needs permission to read labels/issues and create labels/issues in the selected demo project.

## Required GitLab Objects

### Labels

The seed script creates these labels if they do not already exist:

| Label | Color | Purpose |
| --- | --- | --- |
| `release-blocker` | `#D92D20` | Critical item that can block release |
| `release-risk` | `#F79009` | Inquisitor-generated follow-up |
| `checkout` | `#1570EF` | Checkout service area |
| `ci` | `#7A5AF8` | Pipeline or test issue |
| `tests` | `#12B76A` | Test coverage work |
| `high-priority` | `#B42318` | Important release work |

### Issues

The seed script creates these starting issues if they do not already exist:

| Title | Labels | State | Purpose |
| --- | --- | --- | --- |
| `Payment confirmation intermittently fails` | `release-blocker`, `checkout`, `high-priority` | Open | Critical blocker Inquisitor must find |
| `Add auth-service regression tests` | `tests`, `high-priority` | Open | Medium risk tied to recent changes |
| `Update Friday release notes` | `release-risk` | Open | Non-blocking release task |

### Merge Requests

Create or simulate these merge requests:

| Title | Source | Target | State | Purpose |
| --- | --- | --- | --- | --- |
| `Patch payment retry logic` | `fix/payment-retry` | `release/friday` | Approved, unmerged | Shows pending approved work |
| `Update release notes for checkout changes` | `docs/friday-release-notes` | `release/friday` | Approved, unmerged | Shows release housekeeping |
| `Refactor auth session validation` | `feature/auth-session-validation` | `release/friday` | Open | Shows risky service change |

### Pipeline

The release branch should have one failing pipeline:

| Branch | Job | Status | Failure Signal |
| --- | --- | --- | --- |
| `release/friday` | `checkout-e2e` | Failed | Timeout after payment-service retry change |

## Expected Inquisitor Findings

Inquisitor should return:

- Release readiness score around `72%`
- Verdict: `Ship with caution`
- Critical blocker: failing checkout pipeline
- Critical blocker: open `release-blocker` payment issue
- Medium risk: approved but unmerged release MRs
- Medium risk: auth-service change without regression test evidence

## Expected Approval-Gated Actions

After user approval, Inquisitor should prepare these GitLab write actions:

1. Create issue: `Fix failing checkout release pipeline`
2. Create issue: `Resolve release blocker: Payment confirmation intermittently fails`
3. Create issue: `Add auth-service regression tests before release`

## Demo Story

The release looks mostly ready, but Inquisitor catches hidden risks that a human release lead could miss when checking GitLab manually. The strongest visual moment is the shift from evidence to approved action: the agent does not just summarize the risk, it prepares the exact follow-up work needed before shipping.
