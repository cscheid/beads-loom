/**
 * Wrapper for bd CLI commands
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  DependencyTreeNode,
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
    return JSON.parse(output) as Issue;
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
    if (request.labels && request.labels.length > 0) {
      args.push(`-l ${request.labels.join(',')}`);
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
}
