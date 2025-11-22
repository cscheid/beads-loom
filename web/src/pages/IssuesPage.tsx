/**
 * Issues list page
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { FilterBar } from '@/components/FilterBar';
import { IssueCard } from '@/components/IssueCard';
import { useFilterStore } from '@/stores/filterStore';

export function IssuesPage() {
  const {
    data: issues,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['issues'],
    queryFn: api.getIssues,
  });

  const {
    statusFilter,
    priorityFilter,
    typeFilter,
    searchQuery,
    sortField,
    sortDirection,
    setSortField,
    toggleSortDirection,
  } = useFilterStore();

  // Filter and sort issues
  const filteredIssues = useMemo(() => {
    if (!issues) return [];

    const filtered = issues.filter((issue) => {
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

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesDescription = issue.description
          .toLowerCase()
          .includes(query);
        const matchesId = issue.id.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesId) {
          return false;
        }
      }

      return true;
    });

    // Sort issues
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'created_at':
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [
    issues,
    statusFilter,
    priorityFilter,
    typeFilter,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  if (isLoading) {
    return <div className="p-8">Loading issues...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading issues: {(error as Error).message}
      </div>
    );
  }

  return (
    <div>
      <FilterBar />

      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            Issues ({filteredIssues.length})
          </h1>

          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortField}
              onChange={(e) =>
                setSortField(
                  e.target.value as
                    | 'title'
                    | 'priority'
                    | 'created_at'
                    | 'updated_at'
                )
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="created_at">Created</option>
              <option value="updated_at">Updated</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={toggleSortDirection}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
            >
              {sortDirection === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <p className="text-gray-500">No issues match the current filters</p>
        ) : (
          <div>
            {filteredIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
