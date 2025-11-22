/**
 * Filter and sort state management
 */
import { create } from 'zustand';
import type { IssueStatus, IssuePriority, IssueType } from '@loom/shared';

export type SortField = 'created_at' | 'updated_at' | 'priority' | 'title';
export type SortDirection = 'asc' | 'desc';

interface FilterState {
  // Filters
  statusFilter: IssueStatus[];
  priorityFilter: IssuePriority[];
  typeFilter: IssueType[];
  labelFilter: string[];
  searchQuery: string;

  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;

  // Actions
  setStatusFilter: (statuses: IssueStatus[]) => void;
  toggleStatus: (status: IssueStatus) => void;

  setPriorityFilter: (priorities: IssuePriority[]) => void;
  togglePriority: (priority: IssuePriority) => void;

  setTypeFilter: (types: IssueType[]) => void;
  toggleType: (type: IssueType) => void;

  setLabelFilter: (labels: string[]) => void;
  toggleLabel: (label: string) => void;

  setSearchQuery: (query: string) => void;

  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;

  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  // Initial state - no filters
  statusFilter: [],
  priorityFilter: [],
  typeFilter: [],
  labelFilter: [],
  searchQuery: '',

  sortField: 'created_at',
  sortDirection: 'desc',

  // Status filter
  setStatusFilter: (statuses) => set({ statusFilter: statuses }),
  toggleStatus: (status) =>
    set((state) => ({
      statusFilter: state.statusFilter.includes(status)
        ? state.statusFilter.filter((s) => s !== status)
        : [...state.statusFilter, status],
    })),

  // Priority filter
  setPriorityFilter: (priorities) => set({ priorityFilter: priorities }),
  togglePriority: (priority) =>
    set((state) => ({
      priorityFilter: state.priorityFilter.includes(priority)
        ? state.priorityFilter.filter((p) => p !== priority)
        : [...state.priorityFilter, priority],
    })),

  // Type filter
  setTypeFilter: (types) => set({ typeFilter: types }),
  toggleType: (type) =>
    set((state) => ({
      typeFilter: state.typeFilter.includes(type)
        ? state.typeFilter.filter((t) => t !== type)
        : [...state.typeFilter, type],
    })),

  // Label filter
  setLabelFilter: (labels) => set({ labelFilter: labels }),
  toggleLabel: (label) =>
    set((state) => ({
      labelFilter: state.labelFilter.includes(label)
        ? state.labelFilter.filter((l) => l !== label)
        : [...state.labelFilter, label],
    })),

  // Search
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Sorting
  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),
  toggleSortDirection: () =>
    set((state) => ({
      sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
    })),

  // Clear all filters
  clearFilters: () =>
    set({
      statusFilter: [],
      priorityFilter: [],
      typeFilter: [],
      labelFilter: [],
      searchQuery: '',
    }),
}));
