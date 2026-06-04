import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createReleaseInvestigator } from "../agent/release-investigator.js";
import { createMockGitLabAdapter } from "../mcp/mock-gitlab-adapter.js";

const root = normalize(join(fileURLToPath(import.meta.url), "../../.."));
const port = Number(process.env.PORT || 8787);
const gitlab = createMockGitLabAdapter({ root });
const investigator = createReleaseInvestigator({ gitlab });

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

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
      json(res, 200, await investigator.investigate({ prompt: body.prompt || "" }));
      return;
    }

    if (req.method === "POST" && req.url === "/api/approve-actions") {
      json(res, 200, await investigator.approveActions());
      return;
    }

    if (req.method === "GET" && req.url === "/api/demo-project") {
      json(res, 200, await investigator.summarizeDemoProject());
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
