/**
 * Graph visualization page for issue dependencies
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { Issue } from '@loom/shared';
import 'reactflow/dist/style.css';

// Dagre layout configuration
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

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

  // Filter state
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(['open', 'in_progress', 'blocked', 'closed'])
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(['bug', 'feature', 'task', 'epic', 'chore'])
  );

  // Toggle filter selection
  const toggleStatus = (status: string) => {
    const newSet = new Set(selectedStatuses);
    if (newSet.has(status)) {
      newSet.delete(status);
    } else {
      newSet.add(status);
    }
    setSelectedStatuses(newSet);
  };

  const toggleType = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  // Convert issues to nodes and edges with filtering
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!issues) return { initialNodes: [], initialEdges: [] };

    // Step 1: Find selected issues based on filters
    const selectedIssueIds = new Set(
      issues
        .filter(
          (issue) =>
            selectedStatuses.has(issue.status) &&
            selectedTypes.has(issue.issue_type)
        )
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
  }, [issues, selectedStatuses, selectedTypes]);

  // Apply dagre layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, 'LR');
  }, [initialNodes, initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  const [shouldFitView, setShouldFitView] = useState(false);

  // Update nodes and edges when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setShouldFitView(true);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

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
    <div className="w-full h-screen">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
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
        <Panel
          position="top-left"
          className="bg-white p-4 rounded shadow max-w-xs"
        >
          <h2 className="text-lg font-bold mb-2">Dependency Graph</h2>
          <p className="text-sm text-gray-600 mb-3">
            Showing {nodes.length} of {issues?.length || 0} issues
          </p>

          {/* Status Filters */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Status</h3>
            <div className="space-y-1">
              {['open', 'in_progress', 'blocked', 'closed'].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(status)}
                    onChange={() => toggleStatus(status)}
                    className="rounded"
                  />
                  <span>{status.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div className="mb-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Type</h3>
            <div className="space-y-1">
              {['bug', 'feature', 'task', 'epic', 'chore'].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type)}
                    onChange={() => toggleType(type)}
                    className="rounded"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t pt-2 mt-2">
            <h3 className="text-xs font-semibold text-gray-700 mb-1">Legend</h3>
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
  );
}

// Custom minimal issue node component
function IssueNode({ data }: { data: { issue: Issue } }) {
  const { issue } = data;

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div
        className="px-4 py-3 bg-white border border-gray-300 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all"
        style={{ width: nodeWidth }}
      >
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
