# Render Live GitLab Mode

The hosted Render service can run in two modes:

| Mode | Use |
| --- | --- |
| `mock` | Safe public demo using bundled demo data |
| `gitlab` | Live GitLab project evidence from the seeded demo project |

## Current Safe Default

The default mode is:

```text
INQUISITOR_ADAPTER=mock
INQUISITOR_WRITE_MODE=prepare
```

This keeps the hosted demo stable and avoids exposing a GitLab token in a public environment unless explicitly configured.

## Enable Live GitLab Mode

In Render, open the `inquisitor` web service and go to **Environment**.

Add these environment variables:

```text
INQUISITOR_ADAPTER=gitlab
INQUISITOR_WRITE_MODE=prepare
GITLAB_BASE_URL=https://gitlab.com
GITLAB_PROJECT_ID=82910266
GITLAB_RELEASE_BRANCH=release/friday
GITLAB_TOKEN=<your GitLab token>
```

Keep `INQUISITOR_WRITE_MODE=prepare` for the submission demo. This lets Inquisitor read live GitLab state and prepare follow-up issue actions without creating extra GitLab issues from the public hosted app.

Only use this if you intentionally want the hosted demo to create approved follow-up issues:

```text
INQUISITOR_WRITE_MODE=live
```

## Redeploy

After saving the environment variables, trigger a manual deploy in Render.

## Verify

Check the health endpoint:

```text
https://inquisitor-42jb.onrender.com/api/health
```

Expected live response:

```json
{
  "ok": true,
  "adapter": "gitlab",
  "writeMode": "prepare"
}
```

Then test the hosted investigation:

```bash
curl -X POST https://inquisitor-42jb.onrender.com/api/investigate \
  -H 'content-type: application/json' \
  -d '{"prompt":"Check if our Friday release is safe to ship."}'
```

## Security Note

Do not commit `GITLAB_TOKEN` to the repository. Set it only in Render environment variables or your local shell.
