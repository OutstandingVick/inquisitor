const evidence = [
  {
    severity: "critical",
    text: "Checkout pipeline failed on the release branch after the latest payment-service change."
  },
  {
    severity: "high",
    text: "Issue #184 is still labeled release-blocker and has no linked merge request."
  },
  {
    severity: "medium",
    text: "Two approved merge requests are not merged into the release branch."
  },
  {
    severity: "medium",
    text: "Auth service changed in the last 24 hours without matching test updates."
  }
];

const evidenceList = document.querySelector("#evidenceList");
const actionLog = document.querySelector("#actionLog");
const steps = Array.from(document.querySelectorAll(".step"));
const runButton = document.querySelector("#runInvestigation");
const approveButton = document.querySelector("#approveActions");

function renderEvidence() {
  evidenceList.innerHTML = evidence
    .map((item) => `<li><strong>${item.severity.toUpperCase()}:</strong> ${item.text}</li>`)
    .join("");
}

function advanceTimeline() {
  steps.forEach((step) => step.classList.remove("active"));
  let index = 0;

  const timer = window.setInterval(() => {
    steps.forEach((step) => step.classList.remove("active"));
    steps[index].classList.add("active");
    index += 1;

    if (index >= steps.length) {
      window.clearInterval(timer);
    }
  }, 650);
}

runButton.addEventListener("click", () => {
  advanceTimeline();
  actionLog.innerHTML = `
    <li>Created release investigation plan.</li>
    <li>Queried GitLab MCP for issues, merge requests, and pipeline state.</li>
    <li>Generated readiness score and recommended approval-gated actions.</li>
  `;
});

approveButton.addEventListener("click", () => {
  actionLog.innerHTML = `
    <li>Approval received.</li>
    <li>Prepared GitLab issue: Fix failing checkout release pipeline.</li>
    <li>Prepared GitLab issue: Resolve issue #184 before Friday release.</li>
    <li>Prepared GitLab issue: Add auth-service regression tests.</li>
  `;
});

renderEvidence();
