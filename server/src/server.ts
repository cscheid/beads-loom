/**
 * Loom server - WebSocket server with file watcher
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import path from 'path';
import { BeadsWatcher } from './watcher.js';
import { BdCli } from './bd-cli.js';
import { registerRoutes } from './routes.js';
import type { Issue, WSMessage } from '@loom/shared';
import { WebSocket } from 'ws';

/**
 * Parse command-line arguments
 */
function parseArgs(): { workspace?: string; port?: number } {
  const args = process.argv.slice(2);
  const parsed: { workspace?: string; port?: number } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    // --workspace=path or --workspace path
    if (arg.startsWith('--workspace=')) {
      parsed.workspace = arg.split('=')[1];
    } else if (arg === '--workspace' || arg === '-w') {
      parsed.workspace = args[++i];
    }

    // --port=3000 or --port 3000
    if (arg.startsWith('--port=')) {
      parsed.port = parseInt(arg.split('=')[1]);
    } else if (arg === '--port' || arg === '-p') {
      parsed.port = parseInt(args[++i]);
    }
  }

  return parsed;
}

const cliArgs = parseArgs();

const PORT =
  cliArgs.port || (process.env.PORT ? parseInt(process.env.PORT) : 3000);

// Resolve workspace path priority: CLI args > env var > parent directory
const WORKSPACE_PATH = path.resolve(
  cliArgs.workspace ||
    process.env.WORKSPACE_PATH ||
    path.join(process.cwd(), '..')
);

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Store connected WebSocket clients
const clients = new Set<WebSocket>();

// Initialize bd CLI wrapper and watcher
const bdCli = new BdCli(WORKSPACE_PATH);
let currentIssues: Issue[] = [];

const beadsWatcher = new BeadsWatcher(WORKSPACE_PATH, (issues) => {
  currentIssues = issues;
  broadcastToClients({
    type: 'issues_updated',
    data: issues,
  });
});

// Broadcast message to all connected clients
function broadcastToClients(message: WSMessage) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Start server
async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Register WebSocket plugin
    await fastify.register(websocket);

    // WebSocket route
    fastify.register(async (fastify) => {
      fastify.get('/ws', { websocket: true }, (socket) => {
        clients.add(socket);
        fastify.log.info('WebSocket client connected');

        // Send current issues on connect
        socket.send(
          JSON.stringify({
            type: 'issues_updated',
            data: currentIssues,
          } as WSMessage)
        );

        socket.on('close', () => {
          clients.delete(socket);
          fastify.log.info('WebSocket client disconnected');
        });

        socket.on('error', (error) => {
          fastify.log.error({ error }, 'WebSocket error');
          clients.delete(socket);
        });
      });
    });

    // Register REST API routes
    await registerRoutes(fastify, bdCli);

    // Start watching .beads/issues.jsonl
    await beadsWatcher.start();

    // Start server
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Loom server listening on port ${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}/ws`);
    console.log(`Workspace: ${WORKSPACE_PATH}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await beadsWatcher.stop();
  await fastify.close();
  process.exit(0);
});

start();
