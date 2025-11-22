/**
 * Update notification modal - shown when database updates while user has unsaved changes
 */
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';

export function UpdateNotification() {
  const queryClient = useQueryClient();
  const hasPendingUpdate = useUIStore((state) => state.hasPendingUpdate);
  const setHasPendingUpdate = useUIStore((state) => state.setHasPendingUpdate);
  const setHasUnsavedChanges = useUIStore(
    (state) => state.setHasUnsavedChanges
  );

  if (!hasPendingUpdate) {
    return null;
  }

  const handleRefresh = () => {
    // Refresh data
    queryClient.invalidateQueries({ queryKey: ['issues'] });
    queryClient.invalidateQueries({ queryKey: ['issue'] });

    // Clear flags
    setHasPendingUpdate(false);
    setHasUnsavedChanges(false);
  };

  const handleDismiss = () => {
    setHasPendingUpdate(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              Issue Updated
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              The database has been updated. You have unsaved changes.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reload & Discard Changes
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Keep Editing
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
