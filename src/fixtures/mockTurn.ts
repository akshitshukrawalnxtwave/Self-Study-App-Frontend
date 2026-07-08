import type { Turn } from '../types/api';

let turnCounter = 0;

const MISSION_INTERVIEW: Turn = {
  turn_id: 'mock-turn-1',
  messages: [
    {
      role: 'assistant',
      type: 'text',
      content:
        "Welcome! Before we start lessons, I'd like to understand your goals. Why do you want to learn this topic, and what do you hope to be able to do by the end?",
    },
  ],
  artifacts: [],
  panel: { html_url: null },
};

const LESSON_TURN: Turn = {
  turn_id: 'mock-turn-2',
  messages: [
    {
      role: 'assistant',
      type: 'text',
      content:
        "Great — I've drafted your first lesson on hydrostatic pressure. Read through it on the right, then ask me anything that's unclear.",
    },
  ],
  artifacts: [
    {
      type: 'lesson',
      path: 'lessons/0001-demo-lesson.html',
      url: '/workspaces/demo/lessons/0001-demo-lesson.html',
      action: 'created',
    },
    {
      type: 'mission',
      path: 'MISSION.md',
      action: 'updated',
    },
  ],
  panel: {
    html_url: '/workspaces/demo/lessons/0001-demo-lesson.html',
  },
};

const FOLLOW_UP: Turn = {
  turn_id: 'mock-turn-3',
  messages: [
    {
      role: 'assistant',
      type: 'text',
      content:
        "Pressure increases with depth because the weight of the fluid column above a point grows. The formula p = ρgh captures that — ρ is density, g is gravity, h is depth.",
    },
  ],
  artifacts: [],
  panel: {
    html_url: '/workspaces/demo/lessons/0001-demo-lesson.html',
  },
};

export function getMockTurn(userMessage: string, messageIndex: number): Turn {
  turnCounter += 1;

  if (messageIndex === 0) {
    return { ...MISSION_INTERVIEW, turn_id: `mock-turn-${turnCounter}` };
  }

  if (messageIndex === 1) {
    return { ...LESSON_TURN, turn_id: `mock-turn-${turnCounter}` };
  }

  if (userMessage.toLowerCase().includes('pressure') || userMessage.toLowerCase().includes('depth')) {
    return { ...FOLLOW_UP, turn_id: `mock-turn-${turnCounter}` };
  }

  return {
    turn_id: `mock-turn-${turnCounter}`,
    messages: [
      {
        role: 'assistant',
        type: 'text',
        content: `I hear you. You said: "${userMessage}". Ask me to explain a concept from the lesson, or tell me when you're ready for the next topic.`,
      },
    ],
    artifacts: [],
    panel: { html_url: LESSON_TURN.panel?.html_url ?? null },
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
