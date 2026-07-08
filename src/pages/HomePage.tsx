import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkspaceList } from '../components/workspaces/WorkspaceList';
import { NewSessionModal } from '../components/sessions/NewSessionModal';
import { useWorkspaces } from '../hooks/useWorkspaces';

export function HomePage() {
  const navigate = useNavigate();
  const { workspaces, isLoading, error, addWorkspace } = useWorkspaces();
  const [showNewSession, setShowNewSession] = useState(false);

  async function handleCreateSession(title: string, topicSlug: string) {
    const workspace = await addWorkspace({ title, topic_slug: topicSlug });
    navigate(`/workspace/${workspace.id}`);
  }

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div>
          <h1 className="home-page__title">Teach App</h1>
          <p className="home-page__subtitle">Your learning sessions</p>
        </div>
        <button
          type="button"
          className="home-page__create-btn"
          onClick={() => setShowNewSession(true)}
        >
          + New session
        </button>
      </header>

      <main className="home-page__main">
        {error && <p className="home-page__error">{error}</p>}
        <WorkspaceList workspaces={workspaces} isLoading={isLoading} />
      </main>

      <NewSessionModal
        open={showNewSession}
        onClose={() => setShowNewSession(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
}
