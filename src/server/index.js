import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = normalize(join(fileURLToPath(import.meta.url), "../../.."));
const port = Number(process.env.PORT || 8787);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

async function readJson(path) {
  return JSON.parse(await readFile(join(root, path), "utf8"));
}

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function buildInvestigation(snapshot, prompt) {
  return {
    prompt,
    project: snapshot.project,
    release: snapshot.release,
    readinessScore: snapshot.readinessScore,
    verdict: "Ship with caution. Resolve critical CI and checkout blockers first.",
    plan: [
      "Inspect release branch pipeline health.",
      "Search for open release blockers and high-priority bugs.",
      "Review merge requests targeting the release branch.",
      "Identify risky recent changes and missing test coverage.",
      "Prepare approval-gated follow-up issues."
    ],
    evidence: [
      {
        severity: "critical",
        text: `${snapshot.pipelines[0].failedJob} failed on ${snapshot.pipelines[0].branch}: ${snapshot.pipelines[0].evidence}.`
      },
      {
        severity: "critical",
        text: `Issue #${snapshot.issues[0].id} is still open and labeled ${snapshot.issues[0].labels.join(", ")}.`
      },
      {
        severity: "medium",
        text: `${snapshot.mergeRequests.length} approved merge requests have not been merged into the release branch.`
      },
      {
        severity: "medium",
        text: "Recent auth-service changes need matching regression test evidence before release."
      }
    ],
    recommendations: snapshot.recommendations,
    approvalRequest: {
      title: "Create follow-up issues for release blockers?",
      body: "Inquisitor will prepare issues for the failing checkout pipeline, unresolved release blocker, and missing test coverage.",
      required: true
    }
  };
}

function buildApprovedActions(snapshot) {
  return {
    approved: true,
    actions: [
      {
        type: "create_issue",
        title: "Fix failing checkout release pipeline",
        labels: ["release-risk", "ci", "checkout"],
        source: `${snapshot.pipelines[0].branch} / ${snapshot.pipelines[0].failedJob}`
      },
      {
        type: "create_issue",
        title: `Resolve release blocker #${snapshot.issues[0].id}: ${snapshot.issues[0].title}`,
        labels: ["release-risk", "release-blocker"],
        source: `issue #${snapshot.issues[0].id}`
      },
      {
        type: "create_issue",
        title: "Add auth-service regression tests before release",
        labels: ["release-risk", "tests"],
        source: "recent change risk analysis"
      }
    ]
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);
  const ext = extname(filePath);

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/investigate") {
      const body = await parseBody(req);
      const snapshot = await readJson("demo-data/release-snapshot.json");
      json(res, 200, buildInvestigation(snapshot, body.prompt || ""));
      return;
    }

    if (req.method === "POST" && req.url === "/api/approve-actions") {
      const snapshot = await readJson("demo-data/release-snapshot.json");
      json(res, 200, buildApprovedActions(snapshot));
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    json(res, 500, {
      error: "inquisitor_server_error",
      message: error.message
    });
  }
});

server.listen(port, () => {
  console.log(`Inquisitor is running at http://localhost:${port}`);
});
