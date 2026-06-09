export function createGitLabMcpAdapter({
  baseUrl = "https://gitlab.com",
  token,
  projectId,
  releaseBranch = "release/friday",
  writeMode = "prepare"
}) {
  if (!token) {
    throw new Error("GITLAB_TOKEN is required when INQUISITOR_ADAPTER=gitlab.");
  }

  if (!projectId) {
    throw new Error("GITLAB_PROJECT_ID is required when INQUISITOR_ADAPTER=gitlab.");
  }

  const apiBase = `${baseUrl.replace(/\/$/, "")}/api/v4/projects/${encodeURIComponent(projectId)}`;

  async function request(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
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

  function issueSeverity(issue) {
    if (issue.labels.includes("release-blocker")) {
      return "critical";
    }

    if (issue.labels.includes("high-priority")) {
      return "medium";
    }

    return "low";
  }

  function commitRisk(filesChanged) {
    if (filesChanged.some((file) => file.includes("payment") || file.includes("checkout"))) {
      return "high";
    }

    if (filesChanged.some((file) => file.includes("auth"))) {
      return "medium";
    }

    return "low";
  }

  return {
    async getProject() {
      const project = await request("");

      return {
        id: project.path_with_namespace,
        name: project.name,
        defaultBranch: project.default_branch,
        releaseBranch,
        releaseOwner: {
          name: project.owner?.name || project.namespace?.name || "Release owner",
          username: project.owner?.username || project.namespace?.path || "release-owner"
        }
      };
    },

    async listLabels() {
      const labels = await request("/labels?per_page=100");

      return labels.map((label) => ({
        name: label.name,
        color: label.color,
        description: label.description || ""
      }));
    },

    async listIssues() {
      const issues = await request("/issues?state=opened&per_page=100");

      return issues.map((issue) => ({
        iid: issue.iid,
        title: issue.title,
        state: issue.state,
        labels: issue.labels,
        assignee: issue.assignee?.username || null,
        severity: issueSeverity(issue),
        evidence: issue.description || "Open GitLab issue found during release review.",
        expectedAgentFinding: issue.labels.includes("release-blocker") || issue.labels.includes("high-priority")
      }));
    },

    async listMergeRequests() {
      const mergeRequests = await request(
        `/merge_requests?state=opened&target_branch=${encodeURIComponent(releaseBranch)}&per_page=100`
      );

      return Promise.all(
        mergeRequests.map(async (mergeRequest) => {
          let approved = false;

          try {
            const approvals = await request(`/merge_requests/${mergeRequest.iid}/approvals`);
            approved = approvals.approved_by?.length > 0;
          } catch {
            approved = false;
          }

          return {
            iid: mergeRequest.iid,
            title: mergeRequest.title,
            sourceBranch: mergeRequest.source_branch,
            targetBranch: mergeRequest.target_branch,
            state: mergeRequest.state,
            approved,
            merged: mergeRequest.state === "merged",
            author: mergeRequest.author?.username || null,
            risk: mergeRequest.source_branch.includes("payment") ? "high" : "medium",
            evidence: mergeRequest.description || "Open merge request targeting the release branch."
          };
        })
      );
    },

    async listPipelines() {
      const pipelines = await request(`/pipelines?ref=${encodeURIComponent(releaseBranch)}&per_page=5`);

      return Promise.all(
        pipelines.slice(0, 1).map(async (pipeline) => {
          const jobs = await request(`/pipelines/${pipeline.id}/jobs?per_page=100`);

          return {
            id: pipeline.id,
            branch: pipeline.ref,
            sha: pipeline.sha,
            status: pipeline.status,
            jobs: jobs.map((job) => ({
              name: job.name,
              status: job.status,
              stage: job.stage,
              failureReason: job.failure_reason || job.status,
              durationSeconds: job.duration || 0
            }))
          };
        })
      );
    },

    async listRecentCommits() {
      const commits = await request(`/repository/commits?ref_name=${encodeURIComponent(releaseBranch)}&per_page=10`);

      return Promise.all(
        commits.map(async (commit) => {
          let filesChanged = [];

          try {
            const diff = await request(`/repository/commits/${encodeURIComponent(commit.id)}/diff`);
            filesChanged = diff.map((entry) => entry.new_path);
          } catch {
            filesChanged = [];
          }

          return {
            sha: commit.short_id,
            title: commit.title,
            author: commit.author_name,
            filesChanged,
            risk: commitRisk(filesChanged)
          };
        })
      );
    },

    async createIssueDrafts(actions) {
      if (writeMode !== "live") {
        return actions.map((action, index) => ({
          iid: `prepared-${index + 1}`,
          status: "prepared",
          ...action
        }));
      }

      return Promise.all(
        actions.map(async (action) => {
          const issue = await request("/issues", {
            method: "POST",
            body: JSON.stringify({
              title: action.title,
              description: `Created by Inquisitor after human approval.\n\nSource: ${action.source}`,
              labels: action.labels.join(",")
            })
          });

          return {
            iid: issue.iid,
            status: "created",
            webUrl: issue.web_url,
            ...action
          };
        })
      );
    }
  };
}
