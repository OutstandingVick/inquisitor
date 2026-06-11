const evidenceList = document.querySelector("#evidenceList");
const actionLog = document.querySelector("#actionLog");
const steps = Array.from(document.querySelectorAll(".step"));
const runButton = document.querySelector("#runInvestigation");
const approveButton = document.querySelector("#approveActions");
const promptInput = document.querySelector("#releasePrompt");
const scoreValue = document.querySelector("#scoreValue");
const verdict = document.querySelector("#verdict");
const evidenceCount = document.querySelector("#evidenceCount");

let latestInvestigation = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderEvidence(evidence) {
  evidenceList.innerHTML = evidence
    .map((item) =>
      '<li><strong>' +
      escapeHtml(item.severity.toUpperCase()) +
      ':</strong> ' +
      escapeHtml(item.text) +
      '</li>'
    )
    .join("");
  evidenceCount.textContent = evidence.length + " findings";
}

function renderActionLog(items) {
  actionLog.innerHTML = items.map((item) => "<li>" + escapeHtml(item) + "</li>").join("");
}

function setStep(index) {
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("active", stepIndex === index);
  });
}

function advanceTimeline() {
  let index = 0;
  setStep(index);

  const timer = window.setInterval(() => {
    index += 1;
    setStep(Math.min(index, steps.length - 1));

    if (index >= steps.length - 1) {
      window.clearInterval(timer);
    }
  }, 450);
}

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error("Request failed with status " + response.status);
  }

  return response.json();
}

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  runButton.textContent = "Investigating...";
  scoreValue.textContent = "...";
  verdict.textContent = "Inquisitor is gathering GitLab release evidence...";
  evidenceCount.textContent = "Scanning";
  evidenceList.innerHTML = "<li>Reading release branch, blockers, merge requests, and pipeline state...</li>";
  advanceTimeline();
  renderActionLog([
    "Creating release investigation plan...",
    "Calling Inquisitor investigation API...",
    "Inspecting GitLab MCP evidence sources..."
  ]);

  try {
    latestInvestigation = await postJson("/api/investigate", {
      prompt: promptInput.value
    });

    scoreValue.textContent = latestInvestigation.readinessScore;
    verdict.textContent = latestInvestigation.verdict;
    renderEvidence(latestInvestigation.evidence);
    setStep(steps.length - 1);

    renderActionLog([
      "Investigation completed at " + new Date().toLocaleTimeString() + ".",
      "Release checked: " + latestInvestigation.project + " / " + latestInvestigation.release + ".",
      "Queried GitLab evidence for issues, merge requests, and pipeline state.",
      "Generated readiness score and approval-gated recommendations."
    ]);
  } catch (error) {
    verdict.textContent = "Investigation failed. Check the action log for details.";
    renderActionLog(["Investigation failed: " + error.message]);
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Investigate";
  }
});

approveButton.addEventListener("click", async () => {
  approveButton.disabled = true;
  approveButton.textContent = "Preparing...";
  renderActionLog(["Approval received. Preparing GitLab write actions..."]);

  try {
    const result = await postJson("/api/approve-actions", {
      release: latestInvestigation?.release
    });

    renderActionLog([
      "Approval received.",
      ...result.actions.map((action) => "Prepared GitLab issue: " + action.title)
    ]);
  } catch (error) {
    renderActionLog(["Approval failed: " + error.message]);
  } finally {
    approveButton.disabled = false;
    approveButton.textContent = "Approve actions";
  }
});
