import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const baseUrl = process.env.GITLAB_BASE_URL || "https://gitlab.com";
const token = process.env.GITLAB_TOKEN;
const projectId = process.env.GITLAB_PROJECT_ID;

const demoCiFile = {
  path: ".gitlab-ci.yml",
  content: [
    "# Inquisitor demo CI",
    "# This pipeline is intentionally shaped so checkout-e2e fails on release/friday.",
    "",
    "stages:",
    "  - quality",
    "  - test",
    "",
    "lint:",
    "  stage: quality",
    "  script:",
    "    - echo \"lint passed\"",
    "",
    "unit-tests:",
    "  stage: test",
    "  script:",
    "    - echo \"unit tests passed\"",
    "",
    "checkout-e2e:",
    "  stage: test",
    "  script:",
    "    - echo \"Simulating payment confirmation timeout after retry change\"",
    "    - exit 1"
  ].join("\n")
};

const demoFileByBranch = {
  "fix/payment-retry": {
    path: "services/payment/retry-demo.md",
    content: [
      "# Payment Retry Demo Change",
      "",
      "This branch represents the pending payment retry patch that Inquisitor should detect before release.",
      "",
      "Demo signal: approved but unmerged release work."
    ].join("\n")
  },
  "docs/friday-release-notes": {
    path: "docs/friday-release-notes.md",
    content: [
      "# Friday Release Notes",
      "",
      "This branch represents pending release documentation for checkout behavior.",
      "",
      "Demo signal: approved but unmerged release housekeeping."
    ].join("\n")
  },
  "feature/auth-session-validation": {
    path: "services/auth/session-validation-demo.md",
    content: [
      "# Auth Session Validation Demo Change",
      "",
      "This branch represents an auth-sensitive change without enough regression test evidence.",
      "",
      "Demo signal: medium release risk."
    ].join("\n")
  }
};

function requireEnv(name, value) {
  if (!value && !dryRun) {
    throw new Error(`${name} is required. Add it to your shell environment before running this script.`);
  }
}

function projectApi(path) {
  const encodedProjectId = encodeURIComponent(projectId || "demo-project-id");
  return `${baseUrl.replace(/\/$/, "")}/api/v4/projects/${encodedProjectId}${path}`;
}

async function gitlabFetch(path, options = {}) {
  const response = await fetch(projectApi(path), {
    ...options,
    headers: {
      "content-type": "application/json",
      "private-token": token,
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitLab API ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function gitlabFetchOptional(path) {
  const response = await fetch(projectApi(path), {
    headers: {
      "private-token": token
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitLab API ${response.status}: ${body}`);
  }

  return response.json();
}

async function readDemoProject() {
  return JSON.parse(await readFile(join(root, "demo-data/gitlab-demo-project.json"), "utf8"));
}

function issueDescription(issue) {
  return [
    "Seeded for the Inquisitor demo release investigation.",
    "",
    `Severity: ${issue.severity}`,
    `Evidence: ${issue.evidence}`,
    "",
    `Expected agent finding: ${issue.expectedAgentFinding ? "yes" : "no"}`
  ].join("\n");
}

function mergeRequestDescription(mergeRequest) {
  return [
    "Seeded for the Inquisitor demo release investigation.",
    "",
    `Risk: ${mergeRequest.risk}`,
    `Evidence: ${mergeRequest.evidence}`,
    "",
    "This merge request gives Inquisitor real GitLab release state to inspect."
  ].join("\n");
}

async function ensureLabels(labels) {
  if (dryRun) {
    for (const label of labels) {
      console.log(`[dry-run] would ensure label: ${label.name}`);
    }
    return;
  }

  const existingLabels = await gitlabFetch("/labels?per_page=100");
  const existingNames = new Set(existingLabels.map((label) => label.name));

  for (const label of labels) {
    if (existingNames.has(label.name)) {
      console.log(`label exists: ${label.name}`);
      continue;
    }

    await gitlabFetch("/labels", {
      method: "POST",
      body: JSON.stringify({
        name: label.name,
        color: label.color,
        description: label.description
      })
    });
    console.log(`created label: ${label.name}`);
  }
}

async function ensureIssues(issues) {
  if (dryRun) {
    for (const issue of issues) {
      console.log(`[dry-run] would ensure issue: ${issue.title}`);
    }
    return;
  }

  const existingIssues = await gitlabFetch("/issues?state=opened&per_page=100");
  const existingTitles = new Set(existingIssues.map((issue) => issue.title));

  for (const issue of issues) {
    if (existingTitles.has(issue.title)) {
      console.log(`issue exists: ${issue.title}`);
      continue;
    }

    await gitlabFetch("/issues", {
      method: "POST",
      body: JSON.stringify({
        title: issue.title,
        description: issueDescription(issue),
        labels: issue.labels.join(",")
      })
    });
    console.log(`created issue: ${issue.title}`);
  }
}

async function ensureBranch({ branch, ref }) {
  if (dryRun) {
    console.log(`[dry-run] would ensure branch: ${branch} from ${ref}`);
    return;
  }

  const existingBranch = await gitlabFetchOptional(`/repository/branches/${encodeURIComponent(branch)}`);

  if (existingBranch) {
    console.log(`branch exists: ${branch}`);
    return;
  }

  await gitlabFetch("/repository/branches", {
    method: "POST",
    body: JSON.stringify({
      branch,
      ref
    })
  });
  console.log(`created branch: ${branch}`);
}

async function ensureFileOnBranch({ branch, file }) {
  const encodedPath = encodeURIComponent(file.path);
  const existingFile = dryRun
    ? null
    : await gitlabFetchOptional(`/repository/files/${encodedPath}?ref=${encodeURIComponent(branch)}`);

  if (dryRun) {
    console.log(`[dry-run] would ensure file on ${branch}: ${file.path}`);
    return;
  }

  if (existingFile) {
    console.log(`file exists on ${branch}: ${file.path}`);
    return;
  }

  await gitlabFetch(`/repository/files/${encodedPath}`, {
    method: "POST",
    body: JSON.stringify({
      branch,
      content: file.content,
      commit_message: `Seed demo change for ${branch}`
    })
  });
  console.log(`created file on ${branch}: ${file.path}`);
}

async function ensureCiFile({ branch }) {
  const encodedPath = encodeURIComponent(demoCiFile.path);
  const existingFile = dryRun
    ? null
    : await gitlabFetchOptional(`/repository/files/${encodedPath}?ref=${encodeURIComponent(branch)}`);

  if (dryRun) {
    console.log(`[dry-run] would ensure failing CI file on ${branch}: ${demoCiFile.path}`);
    return;
  }

  if (!existingFile) {
    await gitlabFetch(`/repository/files/${encodedPath}`, {
      method: "POST",
      body: JSON.stringify({
        branch,
        content: demoCiFile.content,
        commit_message: "Seed Inquisitor failing checkout CI"
      })
    });
    console.log(`created failing CI file on ${branch}: ${demoCiFile.path}`);
    return;
  }

  await gitlabFetch(`/repository/files/${encodedPath}`, {
    method: "PUT",
    body: JSON.stringify({
      branch,
      content: demoCiFile.content,
      commit_message: "Update Inquisitor failing checkout CI"
    })
  });
  console.log(`updated failing CI file on ${branch}: ${demoCiFile.path}`);
}

async function ensureMergeRequest(mergeRequest) {
  if (dryRun) {
    console.log(
      `[dry-run] would ensure MR: ${mergeRequest.sourceBranch} -> ${mergeRequest.targetBranch} (${mergeRequest.title})`
    );
    return;
  }

  const existingMergeRequests = await gitlabFetch(
    `/merge_requests?state=opened&source_branch=${encodeURIComponent(mergeRequest.sourceBranch)}&target_branch=${encodeURIComponent(
      mergeRequest.targetBranch
    )}`
  );

  if (existingMergeRequests.some((existing) => existing.title === mergeRequest.title)) {
    console.log(`merge request exists: ${mergeRequest.title}`);
    return;
  }

  await gitlabFetch("/merge_requests", {
    method: "POST",
    body: JSON.stringify({
      source_branch: mergeRequest.sourceBranch,
      target_branch: mergeRequest.targetBranch,
      title: mergeRequest.title,
      description: mergeRequestDescription(mergeRequest),
      remove_source_branch: false
    })
  });
  console.log(`created merge request: ${mergeRequest.title}`);
}

async function ensureMergeRequests(mergeRequests) {
  for (const mergeRequest of mergeRequests) {
    await ensureBranch({
      branch: mergeRequest.sourceBranch,
      ref: mergeRequest.targetBranch
    });
    await ensureFileOnBranch({
      branch: mergeRequest.sourceBranch,
      file: demoFileByBranch[mergeRequest.sourceBranch]
    });
    await ensureMergeRequest(mergeRequest);
  }
}

function printManualSetup() {
  console.log("");
  console.log("Manual setup still useful for the strongest demo:");
  console.log("- Optional: approve the first two demo merge requests from a second GitLab account if available.");
}

async function main() {
  requireEnv("GITLAB_TOKEN", token);
  requireEnv("GITLAB_PROJECT_ID", projectId);

  const demoProject = await readDemoProject();
  console.log(`Seeding Inquisitor demo into ${projectId || "demo-project-id"} (${dryRun ? "dry run" : "live"})`);

  await ensureLabels(demoProject.labels);
  await ensureIssues(demoProject.issues);
  await ensureBranch({
    branch: demoProject.project.releaseBranch,
    ref: demoProject.project.defaultBranch
  });
  await ensureCiFile({ branch: demoProject.project.releaseBranch });
  await ensureMergeRequests(demoProject.mergeRequests);
  printManualSetup();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
