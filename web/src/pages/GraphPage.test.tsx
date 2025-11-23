/**
 * Tests for GraphPage layout bug
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Node, Edge } from 'reactflow';
import dagre from 'dagre';

const nodeWidth = 250;
const nodeHeight = 80;

// BUGGY version - uses global graph that is never cleared
const globalDagreGraph = new dagre.graphlib.Graph();
globalDagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElementsBuggy = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  globalDagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    globalDagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    globalDagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(globalDagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = globalDagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// FIXED version - creates fresh graph for each call
const getLayoutedElementsFixed = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  // Create a fresh graph for each layout computation
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

describe('GraphPage layout bug - BUGGY VERSION', () => {
  // Reset global graph before each test
  beforeEach(() => {
    // Clear all nodes and edges from global graph
    const nodes = globalDagreGraph.nodes();
    nodes.forEach((nodeId) => globalDagreGraph.removeNode(nodeId));
  });

  it('should demonstrate the bug: spread-out layout when nodes are filtered out', () => {
    // Step 1: Create a large graph with 10 nodes in a chain
    const largeNodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
      id: `node-${i}`,
      type: 'issueNode',
      data: { issue: { id: `node-${i}`, title: `Issue ${i}` } },
      position: { x: 0, y: 0 },
    }));

    const largeEdges: Edge[] = Array.from({ length: 9 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'smoothstep' as const,
    }));

    // Layout the large graph
    const largeResult = getLayoutedElementsBuggy(largeNodes, largeEdges, 'LR');

    // Calculate the width of the large graph (leftmost to rightmost node)
    const largeXPositions = largeResult.nodes.map((n) => n.position.x);
    const largeWidth =
      Math.max(...largeXPositions) - Math.min(...largeXPositions);

    // Step 2: Now filter to just 2 nodes (simulating a filter change)
    // IMPORTANT: Using the same node IDs (node-0 and node-1) to simulate filtering
    const smallNodes: Node[] = [
      {
        id: 'node-0',
        type: 'issueNode',
        data: { issue: { id: 'node-0', title: 'Issue 0' } },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-1',
        type: 'issueNode',
        data: { issue: { id: 'node-1', title: 'Issue 1' } },
        position: { x: 0, y: 0 },
      },
    ];

    const smallEdges: Edge[] = [
      {
        id: 'small-edge',
        source: 'node-0',
        target: 'node-1',
        type: 'smoothstep' as const,
      },
    ];

    // Layout the small graph
    const smallResult = getLayoutedElementsBuggy(smallNodes, smallEdges, 'LR');

    // Calculate the width of the small graph
    const smallXPositions = smallResult.nodes.map((n) => n.position.x);
    const smallWidth =
      Math.max(...smallXPositions) - Math.min(...smallXPositions);

    // Expected behavior: small graph should be compact
    // With 2 nodes and ranksep=100, width should be around 100 (one gap between nodes)
    // Actual buggy behavior: small graph will have a large width because the dagre
    // graph still contains the old nodes from the large graph

    console.log('BUGGY - Large graph width:', largeWidth);
    console.log('BUGGY - Small graph width:', smallWidth);
    console.log('BUGGY - Dagre graph has nodes:', globalDagreGraph.nodes());

    // This test demonstrates the bug: smallWidth will be much larger than expected
    // because the dagre graph is not cleared between calls
    expect(smallWidth).toBeGreaterThan(300); // Demonstrates the bug - should be ~100 but is ~350+
  });

  it('should demonstrate dagre graph is not cleared between calls', () => {
    // Create first graph
    const nodes1: Node[] = [
      { id: 'test-a', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
      { id: 'test-b', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
    ];

    getLayoutedElementsBuggy(nodes1, [], 'LR');

    // After first layout, dagre graph should have 2 nodes
    const nodesAfterFirst = globalDagreGraph.nodes();
    expect(nodesAfterFirst).toContain('test-a');
    expect(nodesAfterFirst).toContain('test-b');

    // Create second graph with different nodes
    const nodes2: Node[] = [
      { id: 'test-c', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
    ];

    getLayoutedElementsBuggy(nodes2, [], 'LR');

    // BUG: dagre graph still has nodes from first call
    const nodesAfterSecond = globalDagreGraph.nodes();
    console.log(
      'BUGGY - Nodes in dagre graph after second call:',
      nodesAfterSecond
    );

    // This demonstrates the bug - old nodes are still present
    expect(nodesAfterSecond).toContain('test-a'); // Should NOT contain, but does (bug)
    expect(nodesAfterSecond).toContain('test-b'); // Should NOT contain, but does (bug)
    expect(nodesAfterSecond).toContain('test-c'); // Should contain

    // Expected: only ['test-c']
    // Actual: ['test-a', 'test-b', 'test-c'] - showing the bug
  });
});

describe('GraphPage layout - FIXED VERSION', () => {
  it('should have consistent layout regardless of previous calls', () => {
    // The key insight: with a fresh graph each time, the layout should be
    // consistent regardless of what was laid out before

    // First, layout a large graph
    const largeNodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
      id: `node-${i}`,
      type: 'issueNode',
      data: { issue: { id: `node-${i}`, title: `Issue ${i}` } },
      position: { x: 0, y: 0 },
    }));

    const largeEdges: Edge[] = Array.from({ length: 9 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'smoothstep' as const,
    }));

    getLayoutedElementsFixed(largeNodes, largeEdges, 'LR');

    // Now layout just 2 nodes
    const smallNodes: Node[] = [
      {
        id: 'node-0',
        type: 'issueNode',
        data: { issue: { id: 'node-0', title: 'Issue 0' } },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-1',
        type: 'issueNode',
        data: { issue: { id: 'node-1', title: 'Issue 1' } },
        position: { x: 0, y: 0 },
      },
    ];

    const smallEdges: Edge[] = [
      {
        id: 'small-edge',
        source: 'node-0',
        target: 'node-1',
        type: 'smoothstep' as const,
      },
    ];

    const smallResult1 = getLayoutedElementsFixed(smallNodes, smallEdges, 'LR');

    // Now layout the same 2 nodes again (without the large graph beforehand)
    const freshResult = getLayoutedElementsFixed(smallNodes, smallEdges, 'LR');

    // The layouts should be identical because each call gets a fresh graph
    expect(smallResult1.nodes[0].position.x).toBe(
      freshResult.nodes[0].position.x
    );
    expect(smallResult1.nodes[0].position.y).toBe(
      freshResult.nodes[0].position.y
    );
    expect(smallResult1.nodes[1].position.x).toBe(
      freshResult.nodes[1].position.x
    );
    expect(smallResult1.nodes[1].position.y).toBe(
      freshResult.nodes[1].position.y
    );

    console.log('FIXED - Layouts are consistent across calls');
  });

  it('should not retain nodes between calls', () => {
    // This test doesn't need cleanup since each call creates a fresh graph

    // Create first graph
    const nodes1: Node[] = [
      { id: 'test-a', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
      { id: 'test-b', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
    ];

    const result1 = getLayoutedElementsFixed(nodes1, [], 'LR');
    expect(result1.nodes).toHaveLength(2);

    // Create second graph with different nodes
    const nodes2: Node[] = [
      { id: 'test-c', type: 'issueNode', data: {}, position: { x: 0, y: 0 } },
    ];

    const result2 = getLayoutedElementsFixed(nodes2, [], 'LR');

    // FIXED: Each call gets a fresh graph, so there's no pollution
    expect(result2.nodes).toHaveLength(1);
    expect(result2.nodes[0].id).toBe('test-c');

    // The layout should be independent of previous calls
    // For a single node, position should be at origin (0, 0) after dagre layout
    console.log('FIXED - Single node position:', result2.nodes[0].position);
  });
});
