import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { Message } from '../../types/api';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
};

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

function MessageContent({ content }: { content: string }) {
  return (
    <div className="message__content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

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
          <MessageContent content={message.content} />
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
