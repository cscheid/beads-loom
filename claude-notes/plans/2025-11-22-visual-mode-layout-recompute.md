# Fix Visual Mode Layout Recomputation on Filter Changes

**Issue**: beads-ui-23
**Date**: 2025-11-22

## Problem

When filters change in visual mode, the layout doesn't recompute properly and ends up very spread out.

## Plan

1. Explore codebase to understand visual mode and filter implementation
2. Write a test that demonstrates the layout bug
3. Verify the test fails
4. Identify where filter changes should trigger layout recomputation
5. Implement the fix
6. Verify the test passes

## Notes

- Following TDD: test first, then fix

## Results

**Root Cause**: The `getLayoutedElements` function in GraphPage.tsx was using a global `dagreGraph` object that was never cleared between layout computations. When filters changed and reduced the number of nodes, the old nodes remained in the dagre graph, causing the layout to be spread out as if those nodes still existed.

**Fix**: Modified `getLayoutedElements` to create a fresh `dagreGraph` instance for each layout computation (lines 56-60 in GraphPage.tsx). This ensures complete isolation between layouts.

**Tests**: Added comprehensive test suite in GraphPage.test.tsx that:

1. Demonstrates the buggy behavior (nodes accumulate in global graph)
2. Verifies the fix (each call gets fresh graph, layouts are consistent)

All tests passing. Issue closed: beads-ui-23
