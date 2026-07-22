import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChatBox } from '../components/chats';
import { LessonRail } from '../components/lessons/LessonRail';
import { LearningMaterialViewer } from '../components/lessons/LearningMaterialViewer';
import { LessonViewer } from '../components/lessons/LessonViewer';
import { NewSessionModal } from '../components/sessions/NewSessionModal';
import { TripleSplitLayout } from '../components/layout/TripleSplitLayout';
import { FORBIDDEN_WORKSPACE_MESSAGE } from '../api/client';
import { createWorkspace } from '../api/workspaces';
import { useWorkspace } from '../hooks/useWorkspace';
import { useChat } from '../hooks/useChat';
import { useWorkspaceFiles } from '../hooks/useWorkspaceFiles';
import { useLessonPanel } from '../hooks/useLessonPanel';
import { useLearningMaterials } from '../hooks/useLearningMaterials';
import { sameWorkspaceFileUrl, pathFromLessonUrl } from '../utils/lessonUrls';

function trackBadge(title: string, topicSlug?: string): string {
  const source = title.trim() || topicSlug || 'T';
  const words = source.split(/[\s·\-_/]+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const HomeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
  </svg>
);

const PlusIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export function BasePage() {
  const navigate = useNavigate();
  const { workspaceId, sessionId } = useParams<{
    workspaceId?: string;
    sessionId?: string;
  }>();
  const id = workspaceId ?? sessionId;
  const [showNewSkill, setShowNewSkill] = useState(false);
  const [viewerMode, setViewerMode] = useState<'lessons' | 'materials'>('lessons');

  const {
    workspace,
    isLoading: workspaceLoading,
    error: workspaceError,
    isForbidden: workspaceForbidden,
  } = useWorkspace(id);

  const {
    messages,
    lastTurn,
    isLoadingHistory,
    isLoading: chatLoading,
    statusMessage,
    error: chatError,
    isForbidden: chatForbidden,
    sendMessage,
  } = useChat(id ?? null);

  const {
    lessons: syncedLessons,
    materials: syncedMaterials,
    isSyncing,
    syncGeneration,
    error: syncError,
    isForbidden: syncForbidden,
  } = useWorkspaceFiles(id ?? null, lastTurn);

  const accessDenied = workspaceForbidden || chatForbidden || syncForbidden;

  useEffect(() => {
    if (!accessDenied) return;
    navigate('/', {
      replace: true,
      state: { notice: FORBIDDEN_WORKSPACE_MESSAGE },
    });
  }, [accessDenied, navigate]);

  const { htmlUrl, lessons, isLoading: lessonsLoading, selectLesson } = useLessonPanel({
    workspaceId: id ?? null,
    lastTurn,
    lessons: syncedLessons,
    isSyncing,
  });

  const {
    materials,
    selectedUrl: materialUrl,
    selectedMaterial,
    isLoading: materialsLoading,
    selectMaterial,
  } = useLearningMaterials({
    workspaceId: id ?? null,
    materials: syncedMaterials,
    isSyncing,
  });

  const selectedLessonIndex = useMemo(() => {
    if (!htmlUrl) return -1;
    return lessons.findIndex((lesson) => sameWorkspaceFileUrl(htmlUrl, lesson.url));
  }, [htmlUrl, lessons]);

  /** Workspace-relative path of the lesson open in the right panel (for chat context). */
  const currentLessonPath = useMemo(() => {
    if (viewerMode !== 'lessons' || !htmlUrl) {
      return undefined;
    }
    const matched = lessons.find((lesson) => sameWorkspaceFileUrl(htmlUrl, lesson.url));
    if (matched?.path) {
      return matched.path;
    }
    return pathFromLessonUrl(htmlUrl, id) ?? undefined;
  }, [viewerMode, htmlUrl, lessons, id]);

  const handleSendMessage = useCallback(
    (content: string) => {
      void sendMessage(content, currentLessonPath);
    },
    [sendMessage, currentLessonPath],
  );

  const selectLessonAndShow = useCallback(
    (url: string) => {
      setViewerMode('lessons');
      selectLesson(url);
    },
    [selectLesson],
  );

  const selectMaterialAndShow = useCallback(
    (url: string) => {
      setViewerMode('materials');
      selectMaterial(url);
    },
    [selectMaterial],
  );

  const navigateWorkspaceFile = useCallback(
    (url: string) => {
      const matchedLesson = lessons.find((lesson) => sameWorkspaceFileUrl(url, lesson.url));
      if (matchedLesson) {
        selectLessonAndShow(matchedLesson.url);
        return;
      }

      const matchedMaterial = materials.find((material) => sameWorkspaceFileUrl(url, material.url));
      if (matchedMaterial) {
        selectMaterialAndShow(matchedMaterial.url);
        return;
      }

      if (viewerMode === 'materials') {
        selectMaterialAndShow(url);
      } else {
        selectLessonAndShow(url);
      }
    },
    [lessons, materials, selectLessonAndShow, selectMaterialAndShow, viewerMode],
  );

  async function handleCreateSkill(title: string, topicSlug: string) {
    const created = await createWorkspace({ title, topic_slug: topicSlug });
    navigate(`/workspace/${created.id}`);
  }

  if (accessDenied) {
    return (
      <div className="base-page base-page--centered">
        <p>{FORBIDDEN_WORKSPACE_MESSAGE}</p>
        <Link to="/" className="base-page__back-link">
          ← Back to home
        </Link>
      </div>
    );
  }

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

  const progressLabel =
    lessons.length === 0
      ? 'No lessons yet'
      : selectedLessonIndex >= 0
        ? `Lesson ${selectedLessonIndex + 1} of track`
        : `${lessons.length} lesson${lessons.length === 1 ? '' : 's'} in track`;

  const railSelectedUrl = viewerMode === 'lessons' ? htmlUrl : materialUrl;

  return (
    <div className="base-page">
      <header className="topbar">
        <Link to="/" className="topbar__home">
          {HomeIcon}
          Home
        </Link>

        <div className="topbar__crumb">
          <div className="topbar__badge">{trackBadge(workspace.title, workspace.topic_slug)}</div>
          <div>
            <h1>{workspace.title}</h1>
            <div className="topbar__sub">Learn from interactive lessons</div>
          </div>
        </div>

        <div className="topbar__spacer" />

        {lessons.length > 0 ? (
          <div className="topbar__progress">
            <span>{progressLabel}</span>
            <span className="topbar__dots" aria-hidden>
              {lessons.map((lesson, index) => {
                const isDone = selectedLessonIndex >= 0 && index < selectedLessonIndex;
                const isNow =
                  selectedLessonIndex >= 0
                    ? index === selectedLessonIndex
                    : index === lessons.length - 1;
                return (
                  <i
                    key={lesson.id ?? lesson.path ?? lesson.url}
                    className={`topbar__dot${isDone ? ' topbar__dot--done' : ''}${isNow ? ' topbar__dot--now' : ''}`}
                  />
                );
              })}
            </span>
          </div>
        ) : null}

        <button type="button" className="topbar__new" onClick={() => setShowNewSkill(true)}>
          {PlusIcon}
          New skill
        </button>
      </header>

      {syncError ? (
        <p className="base-page__sync-error" role="alert">
          File sync failed: {syncError}
        </p>
      ) : null}

      <TripleSplitLayout
        left={
          <LessonRail
            title={workspace.title}
            lessons={lessons}
            materials={materials}
            selectedUrl={railSelectedUrl}
            onSelectLesson={selectLessonAndShow}
            onSelectMaterial={selectMaterialAndShow}
            lessonsLoading={lessonsLoading}
            materialsLoading={materialsLoading}
          />
        }
        center={
          <ChatBox
            messages={messages}
            isLoading={isLoadingHistory || chatLoading}
            statusMessage={chatLoading ? statusMessage : null}
            error={chatError}
            onSend={handleSendMessage}
            hasLesson={lessons.length > 0}
          />
        }
        right={
          <div className="lesson-pane">
            {viewerMode === 'lessons' ? (
              <LessonViewer
                htmlUrl={htmlUrl}
                workspaceId={id}
                workspaceTitle={workspace.title}
                onNavigate={navigateWorkspaceFile}
                isSyncing={isSyncing}
                syncGeneration={syncGeneration}
              />
            ) : (
              <LearningMaterialViewer
                url={materialUrl}
                format={selectedMaterial?.format ?? null}
                workspaceId={id}
                workspaceTitle={workspace.title}
                onNavigate={navigateWorkspaceFile}
              />
            )}
          </div>
        }
      />

      <NewSessionModal
        open={showNewSkill}
        onClose={() => setShowNewSkill(false)}
        onCreate={handleCreateSkill}
      />
    </div>
  );
}
