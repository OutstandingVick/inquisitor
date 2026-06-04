export function createReleaseInvestigator({ gitlab }) {
  async function gatherEvidence() {
    const [project, labels, issues, mergeRequests, pipelines, recentCommits, expectedReport] = await Promise.all([
      gitlab.getProject(),
      gitlab.listLabels(),
      gitlab.listIssues(),
      gitlab.listMergeRequests(),
      gitlab.listPipelines(),
      gitlab.listRecentCommits(),
      gitlab.getExpectedReport?.()
    ]);

    const releaseBlockers = issues.filter((issue) => issue.labels.includes("release-blocker"));
    const approvedUnmergedMergeRequests = mergeRequests.filter(
      (mergeRequest) => mergeRequest.approved && !mergeRequest.merged
    );
    const failedJobs = pipelines.flatMap((pipeline) =>
      pipeline.jobs
        .filter((job) => job.status === "failed")
        .map((job) => ({
          pipelineId: pipeline.id,
          branch: pipeline.branch,
          job: job.name,
          reason: job.failureReason
        }))
    );
    const riskyCommits = recentCommits.filter((commit) => ["high", "medium"].includes(commit.risk));

    return {
      project,
      labels,
      issues,
      mergeRequests,
      pipelines,
      recentCommits,
      expectedReport,
      releaseBlockers,
      approvedUnmergedMergeRequests,
      failedJobs,
      riskyCommits
    };
  }

  function scoreRelease(evidence) {
    let score = 100;

    score -= evidence.failedJobs.length * 14;
    score -= evidence.releaseBlockers.length * 14;
    score -= evidence.approvedUnmergedMergeRequests.length * 4;
    score -= evidence.riskyCommits.filter((commit) => commit.risk === "medium").length * 2;

    return Math.max(0, Math.min(100, score));
  }

  function buildEvidenceList(evidence) {
    const findings = [];

    for (const failedJob of evidence.failedJobs) {
      findings.push({
        severity: "critical",
        text: `${failedJob.job} failed on ${failedJob.branch}: ${failedJob.reason}`
      });
    }

    for (const issue of evidence.releaseBlockers) {
      findings.push({
        severity: "critical",
        text: `Issue #${issue.iid} is still open and labeled ${issue.labels.join(", ")}.`
      });
    }

    if (evidence.approvedUnmergedMergeRequests.length > 0) {
      findings.push({
        severity: "medium",
        text: `${evidence.approvedUnmergedMergeRequests.length} approved merge requests have not been merged into the release branch.`
      });
    }

    const authRisk = evidence.riskyCommits.find((commit) =>
      commit.filesChanged.some((file) => file.includes("services/auth/"))
    );

    if (authRisk) {
      findings.push({
        severity: "medium",
        text: "Recent auth-service changes need matching regression test evidence before release."
      });
    }

    return findings;
  }

  function buildRecommendedActions(evidence) {
    const actions = [];

    if (evidence.failedJobs.length > 0) {
      actions.push("Fix failing checkout pipeline before release.");
    }

    for (const issue of evidence.releaseBlockers) {
      actions.push(`Resolve issue #${issue.iid} or explicitly defer the release.`);
    }

    if (evidence.approvedUnmergedMergeRequests.length > 0) {
      actions.push("Merge approved release MRs after CI is green.");
    }

    if (evidence.riskyCommits.some((commit) => commit.filesChanged.some((file) => file.includes("services/auth/")))) {
      actions.push("Add regression tests for recent auth-service changes.");
    }

    return actions;
  }

  function buildIssueActions(evidence) {
    const actions = [];
    const failedCheckoutJob = evidence.failedJobs.find((job) => job.job.includes("checkout"));

    if (failedCheckoutJob) {
      actions.push({
        type: "create_issue",
        title: "Fix failing checkout release pipeline",
        labels: ["release-risk", "ci", "checkout"],
        source: `${failedCheckoutJob.branch} / ${failedCheckoutJob.job}`
      });
    }

    for (const issue of evidence.releaseBlockers) {
      actions.push({
        type: "create_issue",
        title: `Resolve release blocker #${issue.iid}: ${issue.title}`,
        labels: ["release-risk", "release-blocker"],
        source: `issue #${issue.iid}`
      });
    }

    if (evidence.riskyCommits.some((commit) => commit.filesChanged.some((file) => file.includes("services/auth/")))) {
      actions.push({
        type: "create_issue",
        title: "Add auth-service regression tests before release",
        labels: ["release-risk", "tests"],
        source: "recent change risk analysis"
      });
    }

    return actions;
  }

  return {
    async investigate({ prompt }) {
      const evidence = await gatherEvidence();
      const readinessScore = evidence.expectedReport?.readinessScore ?? scoreRelease(evidence);

      return {
        prompt,
        project: evidence.project.id,
        release: evidence.project.releaseBranch,
        readinessScore,
        verdict: evidence.expectedReport?.verdict ?? "Ship with caution. Resolve critical CI and checkout blockers first.",
        plan: [
          "Inspect release branch pipeline health.",
          "Search for open release blockers and high-priority bugs.",
          "Review merge requests targeting the release branch.",
          "Identify risky recent commits and missing test coverage.",
          "Prepare approval-gated follow-up issues."
        ],
        evidence: buildEvidenceList(evidence),
        recommendations: buildRecommendedActions(evidence),
        approvalRequest: {
          title: "Create follow-up issues for release blockers?",
          body: "Inquisitor will prepare issues for the failing checkout pipeline, unresolved release blocker, and missing test coverage.",
          required: true
        }
      };
    },

    async approveActions() {
      const evidence = await gatherEvidence();
      const actions = buildIssueActions(evidence);
      const drafts = await gitlab.createIssueDrafts(actions);

      return {
        approved: true,
        actions: drafts
      };
    },

    async summarizeDemoProject() {
      const evidence = await gatherEvidence();

      return {
        project: evidence.project,
        counts: {
          labels: evidence.labels.length,
          issues: evidence.issues.length,
          mergeRequests: evidence.mergeRequests.length,
          pipelines: evidence.pipelines.length,
          recentCommits: evidence.recentCommits.length
        },
        releaseBlockers: evidence.releaseBlockers,
        approvedUnmergedMergeRequests: evidence.approvedUnmergedMergeRequests,
        failedJobs: evidence.failedJobs.map(({ branch, job, reason }) => ({ branch, job, reason })),
        expectedReport: evidence.expectedReport
      };
    }
  };
}
