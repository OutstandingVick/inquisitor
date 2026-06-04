import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function createMockGitLabAdapter({ root }) {
  async function readDemoProject() {
    return JSON.parse(await readFile(join(root, "demo-data/gitlab-demo-project.json"), "utf8"));
  }

  return {
    async getProject() {
      const demoProject = await readDemoProject();
      return demoProject.project;
    },

    async listLabels() {
      const demoProject = await readDemoProject();
      return demoProject.labels;
    },

    async listIssues() {
      const demoProject = await readDemoProject();
      return demoProject.issues;
    },

    async listMergeRequests() {
      const demoProject = await readDemoProject();
      return demoProject.mergeRequests;
    },

    async listPipelines() {
      const demoProject = await readDemoProject();
      return demoProject.pipelines;
    },

    async listRecentCommits() {
      const demoProject = await readDemoProject();
      return demoProject.recentCommits;
    },

    async getExpectedReport() {
      const demoProject = await readDemoProject();
      return demoProject.expectedReport;
    },

    async createIssueDrafts(actions) {
      return actions.map((action, index) => ({
        iid: `draft-${index + 1}`,
        status: "prepared",
        ...action
      }));
    }
  };
}
