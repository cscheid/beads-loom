/**
 * Graph visualization page for issue dependencies
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Panel,
  Handle,
  Position,
  useReactFlow,
} from 'reactflow';
import dagre from 'dagre';
import { api } from '@/lib/api';
import { FilterBar } from '@/components/FilterBar';
import { useFilterStore } from '@/stores/filterStore';
import type { Issue } from '@loom/shared';
import 'reactflow/dist/style.css';

const nodeWidth = 250;
const nodeHeight = 80;

// Component to trigger fitView when needed
function FitViewOnChange({
  shouldFit,
  onFitted,
}: {
  shouldFit: boolean;
  onFitted: () => void;
}) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (shouldFit) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
        onFitted();
      }, 50);
    }
  }, [shouldFit, fitView, onFitted]);

  return null;
}

const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
) => {
  // Create a fresh graph for each layout computation
  // This prevents old nodes from previous layouts affecting the current layout
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

export function GraphPage() {
  const navigate = useNavigate();
  const {
    data: issues,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['graph'],
    queryFn: api.getGraphData,
  });

  // Use shared filter store
  const { statusFilter, priorityFilter, typeFilter } = useFilterStore();

  // Convert issues to nodes and edges with filtering
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!issues) return { initialNodes: [], initialEdges: [] };

    // Step 1: Find selected issues based on filters
    // Empty filter arrays mean "show all"
    const selectedIssueIds = new Set(
      issues
        .filter((issue) => {
          // Status filter
          if (statusFilter.length > 0 && !statusFilter.includes(issue.status)) {
            return false;
          }
          // Priority filter
          if (
            priorityFilter.length > 0 &&
            !priorityFilter.includes(issue.priority)
          ) {
            return false;
          }
          // Type filter
          if (typeFilter.length > 0 && !typeFilter.includes(issue.issue_type)) {
            return false;
          }
          return true;
        })
        .map((issue) => issue.id)
    );

    // Step 2: Build all edges
    const allEdges: Edge[] = [];
    const edgeConnectedIds = new Set<string>();

    issues.forEach((issue) => {
      if (issue.depends_on) {
        issue.depends_on.forEach((dep) => {
          const edge = {
            id: `${issue.id}-${dep.issue.id}`,
            source: dep.issue.id,
            target: issue.id,
            type: 'smoothstep' as const,
            animated: false,
            style: {
              stroke: dep.type === 'blocks' ? '#000000' : '#9ca3af',
              strokeWidth: 2,
            },
          };

          // Include edge if either endpoint is selected
          if (
            selectedIssueIds.has(issue.id) ||
            selectedIssueIds.has(dep.issue.id)
          ) {
            allEdges.push(edge);
            // Mark both endpoints as needed
            edgeConnectedIds.add(issue.id);
            edgeConnectedIds.add(dep.issue.id);
          }
        });
      }
    });

    // Step 3: Include selected nodes + nodes connected by edges
    const displayIds = new Set([...selectedIssueIds, ...edgeConnectedIds]);

    // Step 4: Create nodes for display
    const nodes: Node[] = issues
      .filter((issue) => displayIds.has(issue.id))
      .map((issue) => ({
        id: issue.id,
        type: 'issueNode',
        data: { issue },
        position: { x: 0, y: 0 }, // Will be set by dagre
      }));

    console.log('Graph data:', {
      total: issues.length,
      selected: selectedIssueIds.size,
      displayed: nodes.length,
      edges: allEdges.length,
    });

    return { initialNodes: nodes, initialEdges: allEdges };
  }, [issues, statusFilter, priorityFilter, typeFilter]);

  // Apply dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'LR');
  }, [initialNodes, initialEdges]);

  const [shouldFitView, setShouldFitView] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute highlighted nodes and edges based on hover
  const { highlightedNodeIds, highlightedEdgeIds } = useMemo(() => {
    if (!hoveredNodeId) {
      return {
        highlightedNodeIds: new Set<string>(),
        highlightedEdgeIds: new Set<string>(),
      };
    }

    const nodeIds = new Set([hoveredNodeId]);
    const edgeIds = new Set<string>();

    layoutedEdges.forEach((edge) => {
      if (edge.source === hoveredNodeId || edge.target === hoveredNodeId) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    });

    return { highlightedNodeIds: nodeIds, highlightedEdgeIds: edgeIds };
  }, [hoveredNodeId, layoutedEdges]);

  // Apply highlight styling to nodes
  const displayNodes = useMemo(() => {
    return layoutedNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: highlightedNodeIds.has(node.id),
        isDimmed: hoveredNodeId !== null && !highlightedNodeIds.has(node.id),
      },
    }));
  }, [layoutedNodes, highlightedNodeIds, hoveredNodeId]);

  // Apply highlight styling to edges
  const displayEdges = useMemo(() => {
    return layoutedEdges.map((edge) => {
      const isHighlighted = highlightedEdgeIds.has(edge.id);
      const isDimmed = hoveredNodeId !== null && !isHighlighted;

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: isHighlighted
            ? '#3b82f6'
            : isDimmed
              ? '#d1d5db'
              : edge.style?.stroke,
          strokeWidth: isHighlighted ? 3 : 2,
          opacity: isDimmed ? 0.3 : 1,
        },
      };
    });
  }, [layoutedEdges, highlightedEdgeIds, hoveredNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(displayNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(displayEdges);

  // Track layout changes separately from hover changes
  const prevLayoutRef = useRef({ nodes: layoutedNodes, edges: layoutedEdges });

  // Update nodes and edges when display changes
  useEffect(() => {
    setNodes(displayNodes);
    setEdges(displayEdges);

    // Only fit view if layout actually changed (not just hover state)
    if (
      prevLayoutRef.current.nodes !== layoutedNodes ||
      prevLayoutRef.current.edges !== layoutedEdges
    ) {
      setShouldFitView(true);
      prevLayoutRef.current = { nodes: layoutedNodes, edges: layoutedEdges };
    }
  }, [
    displayNodes,
    displayEdges,
    setNodes,
    setEdges,
    layoutedNodes,
    layoutedEdges,
  ]);

  // Custom node types
  const nodeTypes = useMemo(
    () => ({
      issueNode: IssueNode,
    }),
    []
  );

  // Handle node click - navigate to issue detail
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      navigate(`/issue/${node.id}`);
    },
    [navigate]
  );

  // Handle node hover for highlighting
  const onNodeMouseEnter = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setHoveredNodeId(node.id);
    },
    []
  );

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading dependency graph...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading graph: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <FilterBar />
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <FitViewOnChange
            shouldFit={shouldFitView}
            onFitted={() => setShouldFitView(false)}
          />
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const issue = node.data.issue as Issue;
              return issue.status === 'closed' ? '#d1d5db' : '#3b82f6';
            }}
          />
          <Panel position="top-left" className="bg-white p-3 rounded shadow">
            <h2 className="text-sm font-semibold mb-1">Dependency Graph</h2>
            <p className="text-xs text-gray-600">
              Showing {nodes.length} of {issues?.length || 0} issues
            </p>

            {/* Legend */}
            <div className="border-t pt-2 mt-2">
              <h3 className="text-xs font-semibold text-gray-700 mb-1">
                Legend
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-black"></div>
                  <span>Blocks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-gray-400"></div>
                  <span>Other dependencies</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

// Custom minimal issue node component
function IssueNode({
  data,
}: {
  data: { issue: Issue; isHighlighted?: boolean; isDimmed?: boolean };
}) {
  const { issue, isHighlighted, isDimmed } = data;

  // Build class names based on highlight state
  const containerClasses = [
    'px-4 py-3 bg-white border cursor-pointer transition-all',
    isHighlighted
      ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
      : isDimmed
        ? 'border-gray-200 opacity-40'
        : 'border-gray-300 hover:border-blue-500 hover:shadow-md',
  ].join(' ');

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className={containerClasses} style={{ width: nodeWidth }}>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-gray-500 font-mono">{issue.id}</span>
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              issue.status === 'closed'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {issue.status}
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold leading-tight line-clamp-2">
          {issue.title}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}
