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

export type Turn = {
  turn_id: string;
  messages: Message[];
  artifacts: Artifact[];
  panel?: {
    html_url: string | null;
  };
};

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
