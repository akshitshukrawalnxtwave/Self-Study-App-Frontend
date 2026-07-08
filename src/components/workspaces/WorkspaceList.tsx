import { Link } from 'react-router-dom';
import type { Workspace } from '../../types/api';

type WorkspaceListProps = {
  workspaces: Workspace[];
  isLoading?: boolean;
};

function formatDate(iso: string | undefined): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WorkspaceList({ workspaces, isLoading }: WorkspaceListProps) {
  if (isLoading) {
    return <p className="session-list__status">Loading sessions…</p>;
  }

  if (workspaces.length === 0) {
    return (
      <div className="session-list__empty">
        <p>No sessions yet.</p>
        <p className="session-list__empty-hint">Create your first session to start learning.</p>
      </div>
    );
  }

  return (
    <ul className="session-list">
      {workspaces.map((workspace) => (
        <li key={workspace.id}>
          <Link to={`/workspace/${workspace.id}`} className="session-card">
            <span className="session-card__title">{workspace.title}</span>
            <span className="session-card__meta">
              Created · {formatDate(workspace.created_at)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
