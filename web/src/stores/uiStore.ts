/**
 * UI state management with Zustand
 */
import { create } from 'zustand';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Current view
  currentView: 'list' | 'board' | 'graph' | 'ready';
  setCurrentView: (view: UIState['currentView']) => void;

  // WebSocket connection status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // Unsaved changes tracking
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;

  // Pending update notification
  hasPendingUpdate: boolean;
  setHasPendingUpdate: (hasPending: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // View
  currentView: 'list',
  setCurrentView: (view) => set({ currentView: view }),

  // WebSocket
  wsConnected: false,
  setWsConnected: (connected) => set({ wsConnected: connected }),

  // Unsaved changes
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

  // Pending update
  hasPendingUpdate: false,
  setHasPendingUpdate: (hasPending) => set({ hasPendingUpdate: hasPending }),
}));
