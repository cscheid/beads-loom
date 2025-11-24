/**
 * Issue detail page showing full issue information with edit capabilities
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import type {
  Issue,
  IssueStatus,
  IssuePriority,
  DependencyEdge,
  DependencyType,
} from '@loom/shared';

export function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const setHasUnsavedChanges = useUIStore(
    (state) => state.setHasUnsavedChanges
  );

  // Track editing state
  useEffect(() => {
    setHasUnsavedChanges(isEditing);
  }, [isEditing, setHasUnsavedChanges]);

  // Clear unsaved changes when leaving the page
  useEffect(() => {
    return () => {
      setHasUnsavedChanges(false);
    };
  }, [setHasUnsavedChanges]);

  const {
    data: issue,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['issue', id],
    queryFn: () => api.getIssue(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: api.updateIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      setIsEditing(false);
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.closeIssue(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', id] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading issue...</div>;
  }

  if (error || !issue) {
    return (
      <div className="p-8 text-red-600">
        Error loading issue:{' '}
        {error ? (error as Error).message : 'Issue not found'}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-gray-600">
        <Link to="/" className="hover:text-gray-900">
          Issues
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{issue.id}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <EditableTitle
                issue={issue}
                onSave={(title) => {
                  updateMutation.mutate({ id: issue.id, title });
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div>
                <h1 className="text-3xl font-bold mb-2">{issue.title}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-mono">{issue.id}</span>
                  <span>•</span>
                  <span>Created {formatDate(issue.created_at)}</span>
                  {issue.updated_at !== issue.created_at && (
                    <>
                      <span>•</span>
                      <span>Updated {formatDate(issue.updated_at)}</span>
                    </>
                  )}
                  {issue.closed_at && (
                    <>
                      <span>•</span>
                      <span>Closed {formatDate(issue.closed_at)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetadataField
            label="Status"
            value={
              <StatusBadge
                status={issue.status}
                onUpdate={(status) =>
                  updateMutation.mutate({ id: issue.id, status })
                }
              />
            }
          />
          <MetadataField
            label="Priority"
            value={
              <PriorityBadge
                priority={issue.priority}
                onUpdate={(priority) =>
                  updateMutation.mutate({ id: issue.id, priority })
                }
              />
            }
          />
          <MetadataField
            label="Type"
            value={
              <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded inline-block">
                {issue.issue_type}
              </span>
            }
          />
        </div>

        {/* Description */}
        <div className="border-t pt-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Description
          </h2>
          {isEditing ? (
            <EditableDescription
              issue={issue}
              onSave={(description) => {
                updateMutation.mutate({ id: issue.id, description });
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : issue.description ? (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {issue.description}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-400 italic">No description</p>
          )}
        </div>

        {/* Actions */}
        {issue.status !== 'closed' && (
          <div className="border-t pt-4 mt-4">
            <button
              onClick={() => {
                const reason = prompt('Reason for closing (optional):');
                if (reason !== null) {
                  closeMutation.mutate({
                    id: issue.id,
                    reason: reason || undefined,
                  });
                }
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close Issue
            </button>
          </div>
        )}
      </div>

      {/* Dependencies Section */}
      {((issue.depends_on && issue.depends_on.length > 0) ||
        (issue.depended_by && issue.depended_by.length > 0)) && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Forward Dependencies (what this issue depends on) */}
          {issue.depends_on && issue.depends_on.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Depends On</h2>
              <p className="text-sm text-gray-600 mb-3">
                {issue.status === 'closed'
                  ? 'This issue depended on these:'
                  : 'This issue cannot be completed until these are resolved:'}
              </p>
              <div className="space-y-3">
                {issue.depends_on.map((edge) => (
                  <DependencyCard
                    key={`${edge.issue.id}-forward-${edge.type}`}
                    edge={edge}
                    direction="forward"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reverse Dependencies (what depends on this issue) */}
          {issue.depended_by && issue.depended_by.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Required By</h2>
              <p className="text-sm text-gray-600 mb-3">
                {issue.status === 'closed'
                  ? 'These issues depended on this one:'
                  : 'These issues are waiting for this one to be completed:'}
              </p>
              <div className="space-y-3">
                {issue.depended_by.map((edge) => (
                  <DependencyCard
                    key={`${edge.issue.id}-reverse-${edge.type}`}
                    edge={edge}
                    direction="reverse"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetadataField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function StatusBadge({
  status,
  onUpdate,
}: {
  status: IssueStatus;
  onUpdate: (status: IssueStatus) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const statusColors: Record<IssueStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`text-xs px-2 py-1 rounded inline-block ${statusColors[status]} hover:opacity-80`}
      >
        {status?.replace('_', ' ') || 'unknown'}
      </button>
    );
  }

  return (
    <select
      value={status}
      onChange={(e) => {
        onUpdate(e.target.value as IssueStatus);
        setIsEditing(false);
      }}
      onBlur={() => setIsEditing(false)}
      autoFocus
      className="text-xs px-2 py-1 border border-gray-300 rounded"
    >
      <option value="open">open</option>
      <option value="in_progress">in progress</option>
      <option value="blocked">blocked</option>
      <option value="closed">closed</option>
    </select>
  );
}

function PriorityBadge({
  priority,
  onUpdate,
}: {
  priority: IssuePriority;
  onUpdate: (priority: IssuePriority) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  const priorityColors: Record<IssuePriority, string> = {
    0: 'bg-red-100 text-red-800',
    1: 'bg-orange-100 text-orange-800',
    2: 'bg-yellow-100 text-yellow-800',
    3: 'bg-green-100 text-green-800',
    4: 'bg-gray-100 text-gray-800',
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className={`text-xs px-2 py-1 rounded inline-block ${priorityColors[priority]} hover:opacity-80`}
      >
        P{priority}
      </button>
    );
  }

  return (
    <select
      value={priority}
      onChange={(e) => {
        onUpdate(Number(e.target.value) as IssuePriority);
        setIsEditing(false);
      }}
      onBlur={() => setIsEditing(false)}
      autoFocus
      className="text-xs px-2 py-1 border border-gray-300 rounded"
    >
      <option value={0}>P0 - Critical</option>
      <option value={1}>P1 - High</option>
      <option value={2}>P2 - Medium</option>
      <option value={3}>P3 - Low</option>
      <option value={4}>P4 - Backlog</option>
    </select>
  );
}

function EditableTitle({
  issue,
  onSave,
  onCancel,
}: {
  issue: Issue;
  onSave: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(issue.title);

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-3xl font-bold mb-2 w-full border-b-2 border-blue-600 focus:outline-none"
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(title)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function EditableDescription({
  issue,
  onSave,
  onCancel,
}: {
  issue: Issue;
  onSave: (description: string) => void;
  onCancel: () => void;
}) {
  const [description, setDescription] = useState(issue.description);

  return (
    <div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-600 min-h-[150px]"
        autoFocus
      />
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onSave(description)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DependencyCard({
  edge,
  direction,
}: {
  edge: DependencyEdge;
  direction: 'forward' | 'reverse';
}) {
  const { issue, type } = edge;

  const statusColors: Record<IssueStatus, string> = {
    open: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  // Get human-readable relationship label
  const getRelationshipLabel = (
    depType: DependencyType,
    dir: 'forward' | 'reverse'
  ): string => {
    if (dir === 'forward') {
      switch (depType) {
        case 'blocks':
          return 'Blocked by';
        case 'related':
          return 'Related to';
        case 'parent-child':
          return 'Child of';
        case 'discovered-from':
          return 'Discovered from';
      }
    } else {
      switch (depType) {
        case 'blocks':
          return 'Blocks';
        case 'related':
          return 'Related to';
        case 'parent-child':
          return 'Parent of';
        case 'discovered-from':
          return 'Led to discovering';
      }
    }
  };

  const relationshipLabel = getRelationshipLabel(type, direction);
  const relationshipColor =
    type === 'blocks'
      ? 'bg-red-50 border-red-200'
      : 'bg-blue-50 border-blue-200';

  return (
    <Link
      to={`/issue/${issue.id}`}
      className={`block border-2 rounded-lg p-3 hover:shadow-md transition-shadow ${relationshipColor}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Relationship type badge */}
          <div className="mb-2">
            <span className="text-xs px-2 py-1 bg-white border border-gray-300 rounded font-medium text-gray-700">
              {relationshipLabel}
            </span>
          </div>

          <h3 className="font-semibold">{issue.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {issue.description}
          </p>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded ${statusColors[issue.status]}`}
            >
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
              P{issue.priority}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
              {issue.issue_type}
            </span>
          </div>
        </div>
        <span className="text-sm text-gray-500 font-mono ml-4">{issue.id}</span>
      </div>
    </Link>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}
