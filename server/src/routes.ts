/**
 * REST API routes for Loom server
 */
import { FastifyInstance } from 'fastify';
import { BdCli } from './bd-cli.js';
import type {
  Issue,
  CreateIssueRequest,
  UpdateIssueRequest,
  DependencyTreeNode,
} from '@loom/shared';

export async function registerRoutes(fastify: FastifyInstance, bdCli: BdCli) {
  // Health check
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Get all issues
  fastify.get<{ Reply: Issue[] }>('/api/issues', async () => {
    return await bdCli.listIssues();
  });

  // Get single issue
  fastify.get<{ Params: { id: string }; Reply: Issue }>(
    '/api/issues/:id',
    async (request) => {
      return await bdCli.getIssue(request.params.id);
    }
  );

  // Create issue
  fastify.post<{ Body: CreateIssueRequest; Reply: Issue }>(
    '/api/issues',
    async (request) => {
      return await bdCli.createIssue(request.body);
    }
  );

  // Update issue
  fastify.patch<{ Body: UpdateIssueRequest; Reply: Issue }>(
    '/api/issues',
    async (request) => {
      return await bdCli.updateIssue(request.body);
    }
  );

  // Close issue
  fastify.post<{
    Params: { id: string };
    Body: { reason?: string };
    Reply: Issue;
  }>('/api/issues/:id/close', async (request) => {
    return await bdCli.closeIssue(request.params.id, request.body.reason);
  });

  // Get ready issues
  fastify.get<{ Reply: Issue[] }>('/api/issues/ready', async () => {
    return await bdCli.getReadyIssues();
  });

  // Get blocked issues
  fastify.get<{ Reply: Issue[] }>('/api/issues/blocked', async () => {
    return await bdCli.getBlockedIssues();
  });

  // Get dependency tree for an issue
  fastify.get<{
    Params: { id: string };
    Reply: DependencyTreeNode[];
  }>('/api/issues/:id/dependencies', async (request) => {
    return await bdCli.getDependencyTree(request.params.id);
  });
}
