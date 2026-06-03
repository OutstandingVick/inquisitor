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

function renderEvidence(evidence) {
  evidenceList.innerHTML = evidence
    .map((item) => `<li><strong>${item.severity.toUpperCase()}:</strong> ${item.text}</li>`)
    .join("");
  evidenceCount.textContent = `${evidence.length} findings`;
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

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

runButton.addEventListener("click", async () => {
  advanceTimeline();
  actionLog.innerHTML = `
    <li>Creating release investigation plan...</li>
    <li>Calling Inquisitor investigation API...</li>
  `;

  try {
    latestInvestigation = await postJson("/api/investigate", {
      prompt: promptInput.value
    });

    scoreValue.textContent = latestInvestigation.readinessScore;
    verdict.textContent = latestInvestigation.verdict;
    renderEvidence(latestInvestigation.evidence);

    actionLog.innerHTML = `
      <li>Created release investigation plan.</li>
      <li>Queried mock GitLab MCP adapter for issues, merge requests, and pipeline state.</li>
      <li>Generated readiness score and recommended approval-gated actions.</li>
    `;
  } catch (error) {
    actionLog.innerHTML = `<li>Investigation failed: ${error.message}</li>`;
  }
});

approveButton.addEventListener("click", async () => {
  actionLog.innerHTML = "<li>Approval received. Preparing GitLab write actions...</li>";

  try {
    const result = await postJson("/api/approve-actions", {
      release: latestInvestigation?.release
    });

    actionLog.innerHTML = [
      "<li>Approval received.</li>",
      ...result.actions.map((action) => `<li>Prepared GitLab issue: ${action.title}</li>`)
    ].join("");
  } catch (error) {
    actionLog.innerHTML = `<li>Approval failed: ${error.message}</li>`;
  }
});

postJson("/api/investigate", {
  prompt: promptInput.value
})
  .then((investigation) => {
    latestInvestigation = investigation;
    scoreValue.textContent = investigation.readinessScore;
    verdict.textContent = investigation.verdict;
    renderEvidence(investigation.evidence);
  })
  .catch(() => {
    renderEvidence([
      {
        severity: "critical",
        text: "Start the local server with npm run dev to load live investigation data."
      }
    ]);
  });
