import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import type { Message } from '../../types/api';

type ChatBoxProps = {
  messages: Message[];
  isLoading: boolean;
  /** Ephemeral agent activity while a turn is polling — not a chat message. */
  statusMessage?: string | null;
  error: string | null;
  onSend: (message: string) => void;
  /** Show composer quick prompts only when a lesson already exists. */
  hasLesson?: boolean;
};

const ChatGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
  </svg>
);

export function ChatBox({
  messages,
  isLoading,
  statusMessage = null,
  error,
  onSend,
  hasLesson = false,
}: ChatBoxProps) {
  return (
    <section className="chat">
      <div className="chat-head">
        <span className="chat-head__glyph">{ChatGlyph}</span>
        <div>
          <h2>Your Self Study AI Assistant</h2>
          <p>Asks, explains, and writes lessons for you</p>
        </div>
        <span className="chat-head__live">
          <span className="chat-head__beat" />
          {isLoading ? 'thinking' : 'active'}
        </span>
      </div>

      <div className="chat-stream">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          statusMessage={statusMessage}
        />
      </div>

      {error ? <p className="chat-error">{error}</p> : null}

      <ChatInput onSend={onSend} disabled={isLoading} showQuickPrompts={hasLesson} />
    </section>
  );
}
