import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { Message } from '../../types/api';

type MessageListProps = {
  messages: Message[];
  isLoading: boolean;
  /** Live agent activity while polling — ephemeral UI only. */
  statusMessage?: string | null;
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
    <div className="msg__bubble">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function MessageList({
  messages,
  isLoading,
  statusMessage = null,
}: MessageListProps) {
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
        <p>Start a conversation with your assistant.</p>
        <p className="chat-empty__hint">
          First sessions are often mission interviews — you may not see a lesson right away.
        </p>
      </div>
    );
  }

  const activityText = statusMessage?.trim() || 'Working on your request…';

  return (
    <div className="msg-list">
      {messages.map((message, index) => {
        const isYou = message.role === 'user';
        return (
          <div
            key={`${message.role}-${index}`}
            className={`msg ${isYou ? 'msg--you' : 'msg--tutor'}`}
            style={{ animationDelay: `${Math.min(index, 8) * 0.04}s` }}
          >
            <div className="msg__who">
              {!isYou ? <span className="msg__av">T</span> : null}
              {isYou ? 'You' : 'Self Study AI Assistant'}
            </div>
            <MessageContent content={message.content} />
          </div>
        );
      })}
      {isLoading && (
        <div className="msg msg--tutor msg--loading" aria-live="polite">
          <div className="msg__who">
            <span className="msg__av">T</span>
            Self Study AI Assistant
          </div>
          <div className="msg__bubble msg__bubble--status">{activityText}</div>
        </div>
      )}
    </div>
  );
}
