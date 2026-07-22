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
  /** Ephemeral agent activity text while the turn is queued. */
  status_message?: string;
};

/** Completed turn — assistant messages, artifacts, and panel URL. */
export type Turn = {
  turn_id: string;
  status?: 'completed';
  messages: Message[];
  artifacts: Artifact[];
  panel?: {
    /**
     * Logical workspace path or legacy proxy/S3 URL for the lesson to show.
     * Prefer a relative path like `lessons/0001-….html`.
     */
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
  /** Ephemeral agent activity text — not part of message history. */
  status_message?: string;
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
  /** Workspace-relative path of the lesson open in the panel, if any. */
  current_lesson_path?: string;
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

/** Lesson entry for sidebar + iframe (virtual local URL after sync). */
export type LessonSummary = {
  id?: string;
  path: string;
  url: string;
  title?: string;
};

/** Raw item from GET /api/workspaces/{id}/lessons/ (legacy; prefer manifest). */
export type LessonListItem = {
  id?: string;
  title?: string;
  path?: string;
  url?: string;
  html_url?: string;
};

export type LearningMaterialKind = 'reference' | 'learning_record' | 'resource';

export type LearningMaterialFormat = 'html' | 'markdown';

/** Learning material entry for sidebar + viewer (virtual local URL after sync). */
export type LearningMaterialSummary = {
  id?: string;
  kind: LearningMaterialKind;
  path: string;
  url: string;
  title?: string;
  format: LearningMaterialFormat;
};

/** Raw item from GET /api/workspaces/{id}/materials/ (legacy; prefer manifest). */
export type LearningMaterialListItem = {
  id?: string;
  kind: LearningMaterialKind;
  title?: string;
  path?: string;
  url?: string;
  format?: LearningMaterialFormat;
};

/** One file entry from GET /api/workspaces/{id}/manifest/ */
export type WorkspaceManifestFile = {
  path: string;
  /** Opaque change token — S3 VersionId preferred, else ETag. */
  etag: string;
  size?: number;
  content_type?: string;
};

/** Response from GET /api/workspaces/{id}/manifest/ — no presigned URLs. */
export type WorkspaceManifest = {
  workspace_version: string;
  files: WorkspaceManifestFile[];
};

export type PresignFilesRequest = {
  paths: string[];
};

export type PresignedFile = {
  path: string;
  url: string;
  expires_in?: number;
};

export type PresignFilesResponse = {
  urls: PresignedFile[];
};
