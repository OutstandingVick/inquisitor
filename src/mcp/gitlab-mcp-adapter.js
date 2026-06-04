export function createGitLabMcpAdapter() {
  return {
    async getProject() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async listLabels() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async listIssues() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async listMergeRequests() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async listPipelines() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async listRecentCommits() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    },

    async createIssueDrafts() {
      throw new Error("GitLab MCP adapter is not connected yet.");
    }
  };
}
