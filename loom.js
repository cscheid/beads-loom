#!/usr/bin/env node

/**
 * Loom - Convenience wrapper for running Loom on a beads project
 *
 * Usage:
 *   node loom.js [workspace_path]
 *   loom [workspace_path]           (after global install)
 *
 * Examples:
 *   node loom.js                    # Use current directory
 *   node loom.js .                  # Use current directory
 *   node loom.js /path/to/project   # Use specific project
 */

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync } from 'fs';
import { spawn } from 'child_process';

// Get the directory where this script is located (the loom repo)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LOOM_DIR = __dirname;

// Get workspace path from argument or default to current directory
const workspaceArg = process.argv[2] || '.';

// Resolve to absolute path
const WORKSPACE_PATH = resolve(workspaceArg);

// Check if .beads directory exists
const beadsDir = join(WORKSPACE_PATH, '.beads');
if (!existsSync(beadsDir)) {
  console.warn(`Warning: No .beads directory found in ${WORKSPACE_PATH}`);
  console.warn(
    "Make sure you've initialized beads in this project with 'bd init'"
  );
}

console.log(`Starting Loom for workspace: ${WORKSPACE_PATH}`);
console.log('');
console.log('Web UI will be available at: http://localhost:5173');
console.log('Server will run on: http://localhost:3000');
console.log('');

// Set environment variable and run pnpm dev
const env = { ...process.env, WORKSPACE_PATH };

const child = spawn('pnpm', ['dev'], {
  cwd: LOOM_DIR,
  env,
  stdio: 'inherit',
  shell: true, // Required for Windows to find pnpm
});

child.on('error', (err) => {
  console.error('Failed to start Loom:', err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
