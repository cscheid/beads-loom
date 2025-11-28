# A UI for beads

`beads` is a command-line app for issue tracking well-suited for LLMs and coding agents.
This repository will host the source code for a beads UI, for the humans managing the coding agents.

## **WORK TRACKING**

We use bd (beads) for issue tracking instead of Markdown TODOs or external tools.
We use plans for additional context and bookkeeping. Write plans to `claude-notes/plans/YYYY-MM-DD-<description>.md`, and reference the plan file in the issues.

### Quick Reference

```bash
# Find ready work (no blockers)
bd ready --json

# Create new issue
bd create "Issue title" -t bug|feature|task -p 0-4 -d "Description" --json

# Create with explicit ID (for parallel workers)
bd create "Issue title" --id worker1-100 -p 1 --json

# Create with labels
bd create "Issue title" -t bug -p 1 -l bug,critical --json

# Create multiple issues from markdown file
bd create -f feature-plan.md --json

# Update issue status
bd update <id> --status in_progress --json

# Link discovered work (old way)
bd dep add <discovered-id> <parent-id> --type discovered-from

# Create and link in one command (new way)
bd create "Issue title" -t bug -p 1 --deps discovered-from:<parent-id> --json

# Complete work
bd close <id> --reason "Done" --json

# Show dependency tree
bd dep tree <id>

# Get issue details
bd show <id> --json

# Import with collision detection
bd import -i .beads/issues.jsonl --dry-run             # Preview only
bd import -i .beads/issues.jsonl --resolve-collisions  # Auto-resolve
```

### Workflow

1. **Check for ready work**: Run `bd ready` to see what's unblocked
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work**: If you find bugs or TODOs, create issues:
   - Old way (two commands): `bd create "Found bug in auth" -t bug -p 1 --json` then `bd dep add <new-id> <current-id> --type discovered-from`
   - New way (one command): `bd create "Found bug in auth" -t bug -p 1 --deps discovered-from:<current-id> --json`
5. **Complete**: `bd close <id> --reason "Implemented"`
6. **Export**: Changes auto-sync to `.beads/issues.jsonl` (5-second debounce)

### Issue Types

- `bug` - Something broken that needs fixing
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature composed of multiple issues
- `chore` - Maintenance work (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (nice-to-have features, minor bugs)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Dependency Types

- `blocks` - Hard dependency (issue X blocks issue Y)
- `related` - Soft relationship (issues are connected)
- `parent-child` - Epic/subtask relationship
- `discovered-from` - Track issues discovered during work

Only `blocks` dependencies affect the ready work queue.

## **CRITICAL - TEST-DRIVEN DEVELOPMENT**

When fixing ANY bug:

1. **FIRST**: Write the test
2. **SECOND**: Run the test and verify it fails as expected
3. **THIRD**: Implement the fix
4. **FOURTH**: Run the test and verify it passes

**This is non-negotiable. Never implement a fix before verifying the test fails. Stop and ask the user if you cannot think of a way to mechanically test the bad behavior. Only deviate if writing new features.**

**Do NOT close a beads test suite item unless all tests pass. If you feel you're low on tokens, report that and open subtasks to work on new sessions.**

## General Instructions

- When fixing bugs, always try to isolate and fix one bug at a time.
- when calling shell scripts, ALWAYS BE MINDFUL of the current directory you're operating in. use `pwd` as necessary to avoid confusing yourself over commands that use relative paths.
- When a cd command fails for you, that means you're confused about the current directory. In this situations, ALWAYS run `pwd` before doing anything else.
- use `jq` instead of `python3 -m json.tool` for pretty-printing. When processing JSON in a shell pipeline, prefer `jq` when possible.
- Always create a plan. Always work on the plan one item at a time.
- Sometimes you get confused by macOS's using many different /private/tmp directories linked to /tmp. Prefer to use temporary directories local to the project you're working on (which you can later clean)
- When using `echo` on Bash, be careful about escaping. `!` requires you to use single quotes. BAD, DO NOT USE: echo "![](hello)". GOOD, DO USE: '![](hello)'.
- **CRITICALLY IMPORTANT**. IF YOU EVER FIND YOURSELF WANTING TO WRITE A HACKY SOLUTION (OR A "TODO" THAT UNDOES EXISTING WORK), STOP AND ASK THE USER. THAT MEANS YOUR PLAN IS NOT GOOD ENOUGH
