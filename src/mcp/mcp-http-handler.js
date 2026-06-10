import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

function textResult(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2)
      }
    ]
  };
}

function createMcpServer(investigator) {
  const server = new McpServer({
    name: "inquisitor",
    version: "0.1.0"
  });

  server.registerTool(
    "investigate_release",
    {
      description: "Investigate GitLab release readiness and return a risk report.",
      inputSchema: {
        prompt: z.string().describe("The user's release-readiness request.")
      }
    },
    async ({ prompt }) => textResult(await investigator.investigate({ prompt }))
  );

  server.registerTool(
    "approve_release_actions",
    {
      description: "Prepare or create approved follow-up issue actions after user approval.",
      inputSchema: {}
    },
    async () => textResult(await investigator.approveActions())
  );

  server.registerTool(
    "get_demo_project_summary",
    {
      description: "Return the current GitLab project evidence summary used by Inquisitor.",
      inputSchema: {}
    },
    async () => textResult(await investigator.summarizeDemoProject())
  );

  return server;
}

function writeCorsPreflight(res) {
  res.writeHead(204, {
    "access-control-allow-headers":
      "content-type, accept, mcp-protocol-version, mcp-session-id, authorization",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-origin": "*"
  });
  res.end();
}

function writeMcpError(res, status, message) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message
      },
      id: null
    })
  );
}

export async function handleMcpRequest({ req, res, investigator, parseBody }) {
  if (req.method === "OPTIONS") {
    writeCorsPreflight(res);
    return;
  }

  const server = createMcpServer(investigator);
  const transport = new StreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);

    const body = req.method === "POST" ? await parseBody(req) : undefined;
    await transport.handleRequest(req, res, body);
  } catch (error) {
    if (!res.headersSent) {
      writeMcpError(res, 500, error.message || "Internal MCP server error");
    }
  } finally {
    res.on("close", async () => {
      await transport.close();
      await server.close();
    });
  }
}
