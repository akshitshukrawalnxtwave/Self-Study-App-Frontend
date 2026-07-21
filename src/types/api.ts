export type MessageRole = 'user' | 'assistant';

export type Message = {
  role: MessageRole;
  type: 'text';
  content: string;
};

export type StoredMessage = Message & {
  id: string;
  created_at: string;
};

export type ArtifactType = 'lesson' | 'mission' | 'reference';

export type ArtifactAction = 'created' | 'updated';

export type Artifact = {
  type: ArtifactType;
  path: string;
  url?: string;
  action: ArtifactAction;
};

export type ChatTurnStatus = 'pending' | 'running' | 'completed' | 'failed';

export type ChatTurnErrorCode = 'AGENT_TIMEOUT' | 'INTERNAL_ERROR';

/** Immediate response from POST /chat/ (HTTP 202). */
export type ChatTurnAccepted = {
  turn_id: string;
  status: 'pending';
};

/** Completed turn — assistant messages, artifacts, and panel URL. */
export type Turn = {
  turn_id: string;
  status?: 'completed';
  messages: Message[];
  artifacts: Artifact[];
  panel?: {
    /** S3/CDN URL or Django static path for iframe src. */
    html_url: string | null;
  };
};

export type ChatTurnFailed = {
  turn_id: string;
  status: 'failed';
  error: string;
  code: ChatTurnErrorCode;
};

export type ChatTurnInProgress = {
  turn_id: string;
  status: 'pending' | 'running';
};

/** Response from GET /chat/{turnId}/. */
export type ChatTurnPollResponse = ChatTurnInProgress | Turn | ChatTurnFailed;

export type Workspace = {
  id: string;
  title: string;
  topic_slug: string;
  created_at?: string;
};

export type CreateWorkspaceInput = {
  title: string;
  topic_slug: string;
};

export type SendMessageInput = {
  workspaceId: string;
  content: string;
};

export type ChatSession = {
  id: string;
  title: string;
  workspace_id: string;
  topic_slug: string;
  last_active_at: string;
  created_at?: string;
};

export type CreateSessionInput = {
  title: string;
  topic_slug: string;
};

/** Lesson entry for sidebar + iframe (S3 or Django static URL from API). */
export type LessonSummary = {
  id?: string;
  url: string;
  title?: string;
};

/** Raw item from GET /api/workspaces/{id}/lessons/ */
export type LessonListItem = {
  id?: string;
  title?: string;
  path?: string;
  url?: string;
  html_url?: string;
};

export type LearningMaterialKind = 'reference' | 'learning_record' | 'resource';

export type LearningMaterialFormat = 'html' | 'markdown';

/** Learning material entry for sidebar + viewer (reference HTML, learning records, etc.). */
export type LearningMaterialSummary = {
  id?: string;
  kind: LearningMaterialKind;
  url: string;
  path?: string;
  title?: string;
  format: LearningMaterialFormat;
};

/** Raw item from GET /api/workspaces/{id}/materials/ */
export type LearningMaterialListItem = {
  id?: string;
  kind: LearningMaterialKind;
  title?: string;
  path?: string;
  url?: string;
  format?: LearningMaterialFormat;
};
