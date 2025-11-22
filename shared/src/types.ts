/**
 * Core types for Loom - shared between server and web
 */

export type IssueStatus = 'open' | 'in_progress' | 'blocked' | 'closed';

export type IssuePriority = 0 | 1 | 2 | 3 | 4;

export type IssueType = 'bug' | 'feature' | 'task' | 'epic' | 'chore';

export type DependencyType =
  | 'blocks'
  | 'related'
  | 'parent-child'
  | 'discovered-from';

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  issue_type: IssueType;
  labels: string[];
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Dependencies are returned as full Issue objects by bd show
  dependencies?: Issue[];
}

// Dependency tree response from bd dep tree
export interface DependencyTreeNode extends Issue {
  depth: number;
  truncated: boolean;
}

export interface CreateIssueRequest {
  title: string;
  description?: string;
  priority?: IssuePriority;
  issue_type?: IssueType;
  labels?: string[];
}

export interface UpdateIssueRequest {
  id: string;
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  labels?: string[];
}

// WebSocket message types
export type WSMessageType =
  | 'issues_updated'
  | 'issue_created'
  | 'issue_updated'
  | 'issue_deleted';

export interface WSMessage {
  type: WSMessageType;
  data: unknown;
}
