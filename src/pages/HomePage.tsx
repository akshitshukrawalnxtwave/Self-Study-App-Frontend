import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkspaceList } from '../components/workspaces/WorkspaceList';
import { NewSessionModal } from '../components/sessions/NewSessionModal';
import { useWorkspaces } from '../hooks/useWorkspaces';

type HomeLocationState = {
  notice?: string;
};

const PlusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaces, isLoading, error, addWorkspace } = useWorkspaces();
  const [showNewSession, setShowNewSession] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as HomeLocationState | null;
    if (state?.notice) {
      setNotice(state.notice);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  async function handleCreateSession(title: string, topicSlug: string) {
    const workspace = await addWorkspace({ title, topic_slug: topicSlug });
    navigate(`/workspace/${workspace.id}`);
  }

  return (
    <div className="home-page">
      <header className="home-page__header">
        <div>
          <h1 className="home-page__title">Self Study</h1>
          <p className="home-page__subtitle">Your learning journeys</p>
        </div>
        <button
          type="button"
          className="home-page__create-btn"
          onClick={() => setShowNewSession(true)}
        >
          {PlusIcon}
          <span className="home-page__create-btn-text">New skill</span>
        </button>
      </header>

      <main className="home-page__main">
        {notice && (
          <p className="home-page__error" role="status">
            {notice}
          </p>
        )}
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
