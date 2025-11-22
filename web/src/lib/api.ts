/**
 * API client for Loom server
 */
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
} from '@loom/shared';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export const api = {
  async getIssues(): Promise<Issue[]> {
    const res = await fetch(`${API_BASE}/api/issues`);
    if (!res.ok) throw new Error('Failed to fetch issues');
    return res.json();
  },

  async getIssue(id: string): Promise<Issue> {
    const res = await fetch(`${API_BASE}/api/issues/${id}`);
    if (!res.ok) throw new Error('Failed to fetch issue');
    return res.json();
  },

  async createIssue(request: CreateIssueRequest): Promise<Issue> {
    const res = await fetch(`${API_BASE}/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to create issue');
    return res.json();
  },

  async updateIssue(request: UpdateIssueRequest): Promise<Issue> {
    const res = await fetch(`${API_BASE}/api/issues`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error('Failed to update issue');
    return res.json();
  },

  async closeIssue(id: string, reason?: string): Promise<Issue> {
    const res = await fetch(`${API_BASE}/api/issues/${id}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to close issue');
    return res.json();
  },

  async getReadyIssues(): Promise<Issue[]> {
    const res = await fetch(`${API_BASE}/api/issues/ready`);
    if (!res.ok) throw new Error('Failed to fetch ready issues');
    return res.json();
  },

  async getBlockedIssues(): Promise<Issue[]> {
    const res = await fetch(`${API_BASE}/api/issues/blocked`);
    if (!res.ok) throw new Error('Failed to fetch blocked issues');
    return res.json();
  },
};
