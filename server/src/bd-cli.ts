/**
 * Wrapper for bd CLI commands
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import Database from 'better-sqlite3';
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  DependencyTreeNode,
  DependencyEdge,
  DependencyType,
} from '@loom/shared';

const execAsync = promisify(exec);

export class BdCli {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  private async runCommand(command: string): Promise<string> {
    const { stdout, stderr } = await execAsync(command, {
      cwd: this.workspacePath,
    });

    if (stderr) {
      console.error('bd stderr:', stderr);
    }

    return stdout.trim();
  }

  async listIssues(): Promise<Issue[]> {
    const output = await this.runCommand('bd list --json');
    if (!output) return [];
    return JSON.parse(output) as Issue[];
  }

  async getIssue(id: string): Promise<Issue> {
    const output = await this.runCommand(`bd show ${id} --json`);
    const result = JSON.parse(output);
    // bd show returns an array with single issue
    return Array.isArray(result) ? result[0] : result;
  }

  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    const args: string[] = [];

    args.push(`"${request.title}"`);

    if (request.description) {
      args.push(`-d "${request.description}"`);
    }
    if (request.priority !== undefined) {
      args.push(`-p ${request.priority}`);
    }
    if (request.issue_type) {
      args.push(`-t ${request.issue_type}`);
    }

    args.push('--json');

    const output = await this.runCommand(`bd create ${args.join(' ')}`);
    return JSON.parse(output) as Issue;
  }

  async updateIssue(request: UpdateIssueRequest): Promise<Issue> {
    const args: string[] = [request.id];

    if (request.title !== undefined) {
      args.push(`--title "${request.title}"`);
    }
    if (request.description !== undefined) {
      args.push(`--description "${request.description}"`);
    }
    if (request.status !== undefined) {
      args.push(`--status ${request.status}`);
    }
    if (request.priority !== undefined) {
      args.push(`--priority ${request.priority}`);
    }

    args.push('--json');

    const output = await this.runCommand(`bd update ${args.join(' ')}`);
    return JSON.parse(output) as Issue;
  }

  async closeIssue(id: string, reason?: string): Promise<Issue> {
    const args = [id];
    if (reason) {
      args.push(`--reason "${reason}"`);
    }
    args.push('--json');

    const output = await this.runCommand(`bd close ${args.join(' ')}`);
    const result = JSON.parse(output);
    // bd close returns an array with single issue
    return Array.isArray(result) ? result[0] : result;
  }

  async getReadyIssues(): Promise<Issue[]> {
    const output = await this.runCommand('bd ready --json');
    if (!output) return [];
    return JSON.parse(output) as Issue[];
  }

  async getBlockedIssues(): Promise<Issue[]> {
    const output = await this.runCommand('bd blocked --json');
    if (!output) return [];
    return JSON.parse(output) as Issue[];
  }

  async getDependencyTree(id: string): Promise<DependencyTreeNode[]> {
    const output = await this.runCommand(`bd dep tree ${id} --json`);
    if (!output) return [];
    return JSON.parse(output) as DependencyTreeNode[];
  }

  /**
   * Discover the database path by finding .beads/*.db files
   */
  private async getDbPath(): Promise<string> {
    const { stdout } = await execAsync('ls .beads/*.db', {
      cwd: this.workspacePath,
    });
    return path.join(this.workspacePath, stdout.trim());
  }

  /**
   * Get forward dependencies (issues this one depends on) with type information
   */
  async getDependsOn(issueId: string): Promise<DependencyEdge[]> {
    const dbPath = await this.getDbPath();
    const db = new Database(dbPath, { readonly: true });

    try {
      const rows = db
        .prepare(
          `
          SELECT d.depends_on_id, d.type
          FROM dependencies d
          WHERE d.issue_id = ?
        `
        )
        .all(issueId) as Array<{ depends_on_id: string; type: DependencyType }>;

      const edges: DependencyEdge[] = [];
      for (const row of rows) {
        const issue = await this.getIssue(row.depends_on_id);
        edges.push({ issue, type: row.type });
      }

      return edges;
    } finally {
      db.close();
    }
  }

  /**
   * Get reverse dependencies (issues that depend on this one) with type information
   */
  async getDependedBy(issueId: string): Promise<DependencyEdge[]> {
    const dbPath = await this.getDbPath();
    const db = new Database(dbPath, { readonly: true });

    try {
      const rows = db
        .prepare(
          `
          SELECT d.issue_id, d.type
          FROM dependencies d
          WHERE d.depends_on_id = ?
        `
        )
        .all(issueId) as Array<{ issue_id: string; type: DependencyType }>;

      const edges: DependencyEdge[] = [];
      for (const row of rows) {
        const issue = await this.getIssue(row.issue_id);
        edges.push({ issue, type: row.type });
      }

      return edges;
    } finally {
      db.close();
    }
  }

  /**
   * Get an issue with full dependency information (both forward and reverse)
   */
  async getIssueWithDependencies(id: string): Promise<Issue> {
    const [issue, dependsOn, dependedBy] = await Promise.all([
      this.getIssue(id),
      this.getDependsOn(id),
      this.getDependedBy(id),
    ]);

    return {
      ...issue,
      depends_on: dependsOn.length > 0 ? dependsOn : undefined,
      depended_by: dependedBy.length > 0 ? dependedBy : undefined,
    };
  }

  /**
   * Get all issues with their dependency information
   * More efficient than calling getIssueWithDependencies for each issue
   */
  async getAllIssuesWithDependencies(): Promise<Issue[]> {
    const issues = await this.listIssues();
    const dbPath = await this.getDbPath();
    const db = new Database(dbPath, { readonly: true });

    try {
      // Get all dependencies in one query
      const allDeps = db
        .prepare('SELECT issue_id, depends_on_id, type FROM dependencies')
        .all() as Array<{
        issue_id: string;
        depends_on_id: string;
        type: DependencyType;
      }>;

      // Build maps for quick lookup
      const issueMap = new Map(issues.map((issue) => [issue.id, issue]));
      const dependsOnMap = new Map<string, DependencyEdge[]>();
      const dependedByMap = new Map<string, DependencyEdge[]>();

      // Populate dependency maps
      for (const dep of allDeps) {
        // Forward dependencies (issue depends on something)
        if (!dependsOnMap.has(dep.issue_id)) {
          dependsOnMap.set(dep.issue_id, []);
        }
        const dependsOnIssue = issueMap.get(dep.depends_on_id);
        if (dependsOnIssue) {
          dependsOnMap
            .get(dep.issue_id)!
            .push({ issue: dependsOnIssue, type: dep.type });
        }

        // Reverse dependencies (something depends on issue)
        if (!dependedByMap.has(dep.depends_on_id)) {
          dependedByMap.set(dep.depends_on_id, []);
        }
        const dependedByIssue = issueMap.get(dep.issue_id);
        if (dependedByIssue) {
          dependedByMap
            .get(dep.depends_on_id)!
            .push({ issue: dependedByIssue, type: dep.type });
        }
      }

      // Enrich issues with dependency data
      return issues.map((issue) => ({
        ...issue,
        depends_on: dependsOnMap.get(issue.id),
        depended_by: dependedByMap.get(issue.id),
      }));
    } finally {
      db.close();
    }
  }
}
