const protocolVersion = "2025-06-18";
const sessionId = "inquisitor-session";

function responseHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "access-control-allow-headers":
      "content-type, mcp-protocol-version, mcp-session-id, authorization",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-origin": "*",
    "access-control-expose-headers": "mcp-protocol-version, mcp-session-id",
    "content-type": contentType,
    "mcp-protocol-version": protocolVersion,
    "mcp-session-id": sessionId
  };
}

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

function toolDefinitions() {
  return [
    {
      name: "investigate_release",
      description: "Investigate GitLab release readiness and return a risk report.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "The user's release-readiness request."
          }
        },
        required: ["prompt"]
      }
    },
    {
      name: "approve_release_actions",
      description: "Prepare or create approved follow-up issue actions after user approval.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "get_demo_project_summary",
      description: "Return the current GitLab project evidence summary used by Inquisitor.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ];
}

async function callTool(investigator, params = {}) {
  const args = params.arguments || {};

  if (params.name === "investigate_release") {
    return textResult(await investigator.investigate({ prompt: args.prompt || "" }));
  }

  if (params.name === "approve_release_actions") {
    return textResult(await investigator.approveActions());
  }

  if (params.name === "get_demo_project_summary") {
    return textResult(await investigator.summarizeDemoProject());
  }

  throw new Error(`Unknown MCP tool: ${params.name}`);
}

async function handleMessage(investigator, message) {
  if (message.id === undefined || message.id === null) {
    return null;
  }

  if (message.method === "initialize") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        protocolVersion,
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: "inquisitor",
          version: "0.1.0"
        }
      }
    };
  }

  if (message.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: toolDefinitions()
      }
    };
  }

  if (message.method === "tools/call") {
    try {
      return {
        jsonrpc: "2.0",
        id: message.id,
        result: await callTool(investigator, message.params)
      };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: message.id,
    error: {
      code: -32601,
      message: `Method not found: ${message.method}`
    }
  };
}

export async function handleMcpRequest({ req, res, investigator, parseBody }) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, responseHeaders());
    res.end();
    return;
  }

  if (req.method === "GET") {
    if ((req.headers.accept || "").includes("text/event-stream")) {
      res.writeHead(200, responseHeaders("text/event-stream; charset=utf-8"));
      res.end(
        `event: endpoint\ndata: ${JSON.stringify({
          uri: "/mcp",
          name: "inquisitor",
          protocolVersion
        })}\n\n`
      );
      return;
    }

    res.writeHead(200, responseHeaders());
    res.end(
      JSON.stringify({
        name: "inquisitor",
        protocolVersion,
        transport: "streamable-http",
        tools: toolDefinitions().map((tool) => tool.name)
      })
    );
    return;
  }

  if (req.method === "DELETE") {
    res.writeHead(202, responseHeaders());
    res.end();
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, responseHeaders());
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const body = await parseBody(req);
  const messages = Array.isArray(body) ? body : [body];
  const responses = [];

  for (const message of messages) {
    const response = await handleMessage(investigator, message);

    if (response) {
      responses.push(response);
    }
  }

  if (responses.length === 0) {
    res.writeHead(202, responseHeaders());
    res.end();
    return;
  }

  res.writeHead(200, responseHeaders());
  res.end(JSON.stringify(Array.isArray(body) ? responses : responses[0]));
}
