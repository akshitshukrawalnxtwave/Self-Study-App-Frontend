import type { Message } from '../../types/api';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && isLoading) {
    return (
      <div className="chat-empty">
        <p>Loading chat…</p>
      </div>
    );
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="chat-empty">
        <p>Start a conversation with your teacher.</p>
        <p className="chat-empty__hint">
          First sessions are often mission interviews — you may not see a lesson right away.
        </p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`message message--${message.role}`}
        >
          <span className="message__role">
            {message.role === 'user' ? 'You' : 'Teacher'}
          </span>
          <p className="message__content">{message.content}</p>
        </div>
      ))}
      {isLoading && (
        <div className="message message--assistant message--loading">
          <span className="message__role">Teacher</span>
          <p className="message__content">Thinking…</p>
        </div>
      )}
    </div>
  );
}
