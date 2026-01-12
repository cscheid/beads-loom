# Loom

A modern web interface for [beads](https://github.com/steveyegge/beads) - where the threads of your work come together.

![Loom UI Screenshot](banner-screenshot.png)

## What is Loom?

Loom provides a visual, browser-based UI for managing [beads](https://github.com/steveyegge/beads) issue databases. While beads excels at CLI-based issue tracking for LLM-assisted development, Loom adds powerful visualization and navigation tools for human developers managing the work.

## Features

- **Multiple Views**: List view, Kanban board, dependency graph, and ready work queue
- **Dependency Visualization**: Interactive graphs showing how issues connect and block each other
- **Real-time Sync**: Automatically updates when `.beads/issues.jsonl` changes (from CLI or agents)
- **Powerful Filtering**: Filter by status, priority, type, and labels
- **Full Issue Management**: Create, update, and close issues directly from the UI

## Installation

```bash
# Clone the repository
git clone https://github.com/cscheid/beads-loom.git
cd beads-loom

# Install dependencies (requires pnpm)
pnpm install

# Build all packages
pnpm build
```

## Usage

### Cross-Platform Usage (Recommended)

The easiest way to use Loom across all platforms (Windows, Mac, Linux) is with the Node.js launcher:

**Global installation (recommended):**

```bash
# If you installed pnpm as a standalone binary (via scoop, winget, Homebrew, etc.),
# run this once to configure pnpm's global bin directory:
pnpm setup

# Install globally from the loom directory
cd beads-loom
pnpm link --global

# Now use 'loom' command from anywhere
loom .                    # Use current directory
loom /path/to/project     # Use specific project
```

**Direct execution (no install):**

```bash
# From your project directory
node /path/to/beads-loom/loom.js .

# Or from the loom directory
pnpm loom /path/to/project
```

**Install from GitHub:**

```bash
# Install globally from GitHub
pnpm add -g github:cderv/beads-loom

# Then use 'loom' command anywhere
loom /path/to/project
```

The web UI will open at http://localhost:5173 and the server runs on http://localhost:3000.

### Unix/Mac: Bash Script

For Unix/Mac users or Windows users with Git Bash, the original bash script is still available:

```bash
# From your project directory
/path/to/beads-loom/loom .

# Or specify a project path
/path/to/beads-loom/loom /path/to/your-project
```

**Note:** The global `loom` command (after `pnpm link --global`) uses the cross-platform Node.js launcher.

### Alternative Methods

**Using environment variable:**

```bash
WORKSPACE_PATH=/path/to/your-project pnpm dev
```

**Using CLI arguments:**

```bash
# From the beads-loom directory
pnpm --filter @loom/server dev --workspace /path/to/your-project

# Start both server and web UI
WORKSPACE_PATH=/path/to/your-project pnpm dev
```

**For development on the beads-loom project itself:**

```bash
# From the beads-loom directory
WORKSPACE_PATH=. pnpm dev
```

The server automatically watches your `.beads/` directory for changes and broadcasts updates via WebSocket.

## Architecture

Loom is a monorepo with three packages:

- **web**: React + TypeScript frontend (Vite, Tailwind CSS, shadcn/ui)
- **server**: Node.js/Fastify backend with WebSocket and file watching
- **shared**: Shared TypeScript types and utilities

## Requirements

- Node.js 18+
- pnpm
- [beads](https://github.com/steveyegge/beads) CLI installed and initialized in your project

### Windows Requirements

The `better-sqlite3` native dependency automatically downloads prebuilt binaries for Node.js LTS versions. If you're using a non-LTS Node.js version or encounter installation errors, you may need [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with the "Desktop development with C++" workload.

## License

MIT - see [LICENSE](LICENSE) for details
