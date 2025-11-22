/**
 * Ready work page
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function ReadyPage() {
  const {
    data: issues,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['issues', 'ready'],
    queryFn: api.getReadyIssues,
  });

  if (isLoading) {
    return <div className="p-8">Loading ready work...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading ready work: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Ready Work</h1>
      <p className="text-sm text-gray-600 mb-4">
        Issues with no blocking dependencies
      </p>
      {issues && issues.length === 0 ? (
        <p className="text-gray-500">No ready work available</p>
      ) : (
        <div className="space-y-4">
          {issues?.map((issue) => (
            <div
              key={issue.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{issue.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {issue.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                      Ready
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      P{issue.priority}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
                      {issue.issue_type}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{issue.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
