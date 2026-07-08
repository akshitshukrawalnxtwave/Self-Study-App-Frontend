import { Link } from 'react-router-dom';
import type { ChatSession } from '../../types/api';

type SessionListProps = {
  sessions: ChatSession[];
  isLoading?: boolean;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionList({ sessions, isLoading }: SessionListProps) {
  if (isLoading) {
    return <p className="session-list__status">Loading sessions…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="session-list__empty">
        <p>No sessions yet.</p>
        <p className="session-list__empty-hint">Create your first session to start learning.</p>
      </div>
    );
  }

  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link to={`/session/${session.id}`} className="session-card">
            <span className="session-card__title">{session.title}</span>
            <span className="session-card__meta">
              Last active · {formatDate(session.last_active_at)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
