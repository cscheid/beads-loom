/**
 * Shared issue card component for list views
 */
import { Link } from 'react-router-dom';
import type { Issue } from '@loom/shared';

interface IssueCardProps {
  issue: Issue;
}

export function IssueCard({ issue }: IssueCardProps) {
  // Truncate description at 200 characters
  const truncatedDescription =
    issue.description.length > 200
      ? issue.description.substring(0, 200) + '...'
      : issue.description;

  return (
    <Link
      to={`/issue/${issue.id}`}
      className="block p-4 hover:border hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-baseline gap-3">
        {/* Issue ID on the left */}
        <span className="text-sm text-gray-500 font-mono flex-shrink-0">
          {issue.id}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg leading-none">
              {issue.title}
            </h3>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
              P{issue.priority}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">
              {issue.issue_type}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{truncatedDescription}</p>
        </div>
      </div>
    </Link>
  );
}
