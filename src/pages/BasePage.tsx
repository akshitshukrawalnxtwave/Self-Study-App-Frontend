import { Link, useParams } from 'react-router-dom';
import { SplitLayout } from '../components/layout/SplitLayout';
import { ChatBox } from '../components/chats';
import { LessonViewer } from '../components/lessons/LessonViewer';
import { LessonHistory } from '../components/lessons/LessonHistory';
import { useWorkspace } from '../hooks/useWorkspace';
import { useChat } from '../hooks/useChat';
import { useLessonPanel } from '../hooks/useLessonPanel';

export function BasePage() {
  const { workspaceId, sessionId } = useParams<{
    workspaceId?: string;
    sessionId?: string;
  }>();
  const id = workspaceId ?? sessionId;
  const { workspace, isLoading: workspaceLoading, error: workspaceError } =
    useWorkspace(id);

  const { messages, lastTurn, isLoadingHistory, isLoading: chatLoading, error: chatError, sendMessage } =
    useChat(id ?? null);

  const { htmlUrl, lessons, isLoading: lessonsLoading, selectLesson } =
    useLessonPanel(id ?? null, lastTurn);

  if (workspaceLoading) {
    return (
      <div className="base-page base-page--centered">
        <p>Loading session…</p>
      </div>
    );
  }

  if (workspaceError || !workspace) {
    return (
      <div className="base-page base-page--centered">
        <p>{workspaceError ?? 'Session not found'}</p>
        <Link to="/" className="base-page__back-link">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="base-page">
      <header className="teach-header teach-header--with-back">
        <Link to="/" className="base-page__back">
          ← Home
        </Link>
        <div>
          <h1 className="teach-header__title">{workspace.title}</h1>
          <p className="teach-header__subtitle">Chat with your teacher · Interactive lessons</p>
        </div>
      </header>

      <div className="teach-toolbar">
        <LessonHistory
          lessons={lessons}
          selectedUrl={htmlUrl}
          onSelect={selectLesson}
          isLoading={lessonsLoading}
        />
      </div>

      <SplitLayout
        left={
          <ChatBox
            messages={messages}
            isLoading={isLoadingHistory || chatLoading}
            error={chatError}
            onSend={sendMessage}
          />
        }
        right={
          <LessonViewer htmlUrl={htmlUrl} workspaceTitle={workspace.title} />
        }
      />
    </div>
  );
}
