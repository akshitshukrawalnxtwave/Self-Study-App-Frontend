import type { ChatSession } from '../types/api';

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: 'session-demo-1',
    title: 'Fluid Mechanics',
    workspace_id: 'demo',
    topic_slug: 'fluid-mechanics',
    last_active_at: '2026-07-06T10:30:00Z',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'session-pandas-1',
    title: 'Pandas for Hackathons',
    workspace_id: 'pandas-demo',
    topic_slug: 'pandas-for-hackathons',
    last_active_at: '2026-07-05T16:45:00Z',
    created_at: '2026-02-01T14:30:00Z',
  },
];
