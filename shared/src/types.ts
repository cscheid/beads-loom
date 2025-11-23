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

// A dependency edge with the related issue and type information
export interface DependencyEdge {
  issue: Issue;
  type: DependencyType;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  issue_type: IssueType;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Forward dependencies: issues this one depends on
  depends_on?: DependencyEdge[];
  // Reverse dependencies: issues that depend on this one
  depended_by?: DependencyEdge[];
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
}

export interface UpdateIssueRequest {
  id: string;
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
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
