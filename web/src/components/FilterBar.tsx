/**
 * Filter bar component
 */
import { useFilterStore } from '@/stores/filterStore';
import type { IssueStatus, IssuePriority, IssueType } from '@loom/shared';

const STATUSES: IssueStatus[] = ['open', 'in_progress', 'blocked', 'closed'];
const PRIORITIES: IssuePriority[] = [0, 1, 2, 3, 4];
const TYPES: IssueType[] = ['bug', 'feature', 'task', 'epic', 'chore'];

export function FilterBar() {
  const {
    statusFilter,
    priorityFilter,
    typeFilter,
    searchQuery,
    toggleStatus,
    togglePriority,
    toggleType,
    setSearchQuery,
    clearFilters,
  } = useFilterStore();

  const hasFilters =
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    typeFilter.length > 0 ||
    searchQuery.length > 0;

  return (
    <div className="bg-white border-b border-gray-200 p-4 space-y-4">
      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters - horizontal layout */}
      <div className="flex gap-6 items-start">
        {/* Status filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  statusFilter.includes(status)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Priority
          </label>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((priority) => (
              <button
                key={priority}
                onClick={() => togglePriority(priority)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  priorityFilter.includes(priority)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                P{priority}
              </button>
            ))}
          </div>
        </div>

        {/* Type filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Type
          </label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  typeFilter.includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
