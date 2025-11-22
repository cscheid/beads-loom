# Loom

A modern web interface for [beads](https://github.com/steveyegge/beads) - where the threads of your work come together.

## Overview

Loom provides a rich, visual interface for managing beads issue databases. It's designed for teams using coding agents and LLMs for software development, offering multiple views to understand dependencies, track progress, and manage work.

## Features

- **Multiple Views**: List, Kanban board, dependency graph, and ready work queue
- **Dependency Visualization**: Interactive D3-based graphs showing how issues connect
- **Real-time Sync**: Watches `.beads/issues.jsonl` for changes from CLI
- **Powerful Filtering**: Filter by status, priority, type, and labels
- **Issue Management**: Create, update, and close issues directly from the UI

## Architecture

Loom consists of two parts:

1. **Web Frontend**: React + TypeScript SPA with Vite
2. **Local Server**: Node.js server that watches your `.beads/` directory and provides WebSocket updates

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **State**: Zustand (UI state) + TanStack Query (server state)
- **Visualization**: D3.js
- **Backend**: Node.js/Fastify with WebSocket support

## Development

See the [project plan](claude-notes/plans/2025-11-22-loom-spa.md) for detailed architecture and development phases.

## License

TBD
