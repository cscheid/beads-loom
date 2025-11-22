/**
 * Ready work page
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { IssueCard } from '@/components/IssueCard';

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
        <div>
          {issues?.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
