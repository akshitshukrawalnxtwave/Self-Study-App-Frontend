import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SplitLayout } from '../components/layout/SplitLayout';
import { ChatBox } from '../components/chats';
import { ContentPanel, type ContentPanelTab } from '../components/lessons/ContentPanel';
import { LearningMaterialViewer } from '../components/lessons/LearningMaterialViewer';
import { LessonViewer } from '../components/lessons/LessonViewer';
import { useWorkspace } from '../hooks/useWorkspace';
import { useChat } from '../hooks/useChat';
import { useLearningMaterials } from '../hooks/useLearningMaterials';
import { useLessonPanel } from '../hooks/useLessonPanel';

export function BasePage() {
  const { workspaceId, sessionId } = useParams<{
    workspaceId?: string;
    sessionId?: string;
  }>();
  const id = workspaceId ?? sessionId;
  const [activeTab, setActiveTab] = useState<ContentPanelTab>('lessons');

  const { workspace, isLoading: workspaceLoading, error: workspaceError } =
    useWorkspace(id);

  const { messages, lastTurn, isLoadingHistory, isLoading: chatLoading, error: chatError, sendMessage } =
    useChat(id ?? null);

  const { htmlUrl, lessons, isLoading: lessonsLoading, selectLesson } =
    useLessonPanel(id ?? null, lastTurn);

  const {
    materials,
    selectedUrl: materialUrl,
    selectedMaterial,
    isLoading: materialsLoading,
    selectMaterial,
  } = useLearningMaterials(id ?? null);

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

  const panelSelectedUrl = activeTab === 'lessons' ? htmlUrl : materialUrl;
  const onPanelSelect = activeTab === 'lessons' ? selectLesson : selectMaterial;

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
        <ContentPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lessons={lessons}
          materials={materials}
          selectedUrl={panelSelectedUrl}
          onSelect={onPanelSelect}
          lessonsLoading={lessonsLoading}
          materialsLoading={materialsLoading}
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
          activeTab === 'lessons' ? (
            <LessonViewer
              htmlUrl={htmlUrl}
              workspaceId={id}
              workspaceTitle={workspace.title}
              onNavigate={selectLesson}
            />
          ) : (
            <LearningMaterialViewer
              url={materialUrl}
              format={selectedMaterial?.format ?? null}
              workspaceId={id}
              workspaceTitle={workspace.title}
              onNavigate={selectMaterial}
            />
          )
        }
      />
    </div>
  );
}
