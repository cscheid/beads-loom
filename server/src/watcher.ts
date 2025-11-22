/**
 * File watcher for .beads/issues.jsonl
 */
import { watch, FSWatcher } from 'chokidar';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Issue } from '@loom/shared';

export type IssuesUpdateCallback = (issues: Issue[]) => void;

export class BeadsWatcher {
  private watcher: FSWatcher | null = null;
  private beadsPath: string;
  private issuesFile: string;
  private callback: IssuesUpdateCallback;

  constructor(workspacePath: string, callback: IssuesUpdateCallback) {
    this.beadsPath = join(workspacePath, '.beads');
    this.issuesFile = join(this.beadsPath, 'issues.jsonl');
    this.callback = callback;
  }

  async start(): Promise<void> {
    console.log(`Watching: ${this.issuesFile}`);

    // Watch for changes to issues.jsonl
    this.watcher = watch(this.issuesFile, {
      persistent: true,
      ignoreInitial: false,
    });

    this.watcher.on('add', () => this.handleChange('added'));
    this.watcher.on('change', () => this.handleChange('changed'));

    this.watcher.on('error', (error) => {
      console.error('Watcher error:', error);
    });
  }

  private async handleChange(event: string): Promise<void> {
    console.log(`File ${event}: ${this.issuesFile}`);

    try {
      const issues = await this.loadIssues();
      this.callback(issues);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  }

  async loadIssues(): Promise<Issue[]> {
    try {
      const content = await readFile(this.issuesFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => JSON.parse(line) as Issue);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('Issues file not found, returning empty array');
        return [];
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('Watcher stopped');
    }
  }
}
