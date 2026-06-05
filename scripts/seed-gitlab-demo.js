import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const baseUrl = process.env.GITLAB_BASE_URL || "https://gitlab.com";
const token = process.env.GITLAB_TOKEN;
const projectId = process.env.GITLAB_PROJECT_ID;

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
    `Seeded for the Inquisitor demo release investigation.`,
    "",
    `Severity: ${issue.severity}`,
    `Evidence: ${issue.evidence}`,
    "",
    `Expected agent finding: ${issue.expectedAgentFinding ? "yes" : "no"}`
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

function printManualSetup(demoProject) {
  console.log("");
  console.log("Manual setup still needed for the full demo:");

  for (const mergeRequest of demoProject.mergeRequests) {
    console.log(`- Create MR: ${mergeRequest.sourceBranch} -> ${mergeRequest.targetBranch} (${mergeRequest.title})`);
  }

  const failedJob = demoProject.pipelines[0].jobs.find((job) => job.status === "failed");
  console.log(`- Configure CI so ${failedJob.name} fails on ${demoProject.project.releaseBranch}`);
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
  printManualSetup(demoProject);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
